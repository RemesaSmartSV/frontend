import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import MiPerfil from './MiPerfil'

// Editor de foto por archivo (T3): file input, validación en el cliente,
// previsualización, subida antes del PUT, borrado con DELETE e iniciales
// como fallback. El backend se stubbea con global.fetch, igual que en
// MiPerfil.test.jsx.

const fetchOriginal = global.fetch

function respuesta(cuerpo, status = 200) {
    return new Response(JSON.stringify(cuerpo), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

function respuestaVacia(status) {
    return new Response(null, { status })
}

afterEach(() => {
    cleanup()
    global.fetch = fetchOriginal
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
})

function prepararUsuario(extra = {}) {
    localStorage.setItem(
        'usuario',
        JSON.stringify({
            idUsuario: 1,
            nombre: 'Ana Duarte',
            correo: 'ana@demo.com',
            rol: 'Miembro',
            idHogar: 1,
            ...extra,
        })
    )
}

// Mock de fetch con registro de llamadas: /Hogares para la carga inicial y
// los tres endpoints del flujo de foto + PUT perfil.
function crearFetch(registro = []) {
    return vi.fn(async (url, opciones = {}) => {
        const ruta = String(url)
        const metodo = opciones.method || 'GET'
        registro.push({ ruta, metodo, opciones })

        if (ruta.includes('/Hogares')) return respuesta({ idHogar: 1, nombreFamiliar: 'Familia Ana' })
        if (metodo === 'POST' && ruta.endsWith('/Usuarios/foto')) {
            return respuesta({ fotoPerfil: '/api/Usuarios/foto/1' })
        }
        if (metodo === 'PUT' && ruta.endsWith('/Usuarios/perfil')) return respuestaVacia(204)
        if (metodo === 'DELETE' && ruta.endsWith('/Usuarios/foto')) return respuestaVacia(204)
        return respuesta([])
    })
}

describe('MiPerfil — foto por archivo', () => {
    it('renderiza el input de archivo con etiqueta, ayuda y accept PNG/JPG', async () => {
        prepararUsuario()
        global.fetch = crearFetch()

        render(<MiPerfil />)

        const input = await screen.findByLabelText('Foto de perfil')
        expect(input).toHaveAttribute('type', 'file')
        expect(input).toHaveAttribute('accept', 'image/png,image/jpeg')

        expect(
            screen.getByText('PNG o JPG, hasta 5 MB. Se reduce a 512×512 antes de subir.')
        ).toBeInTheDocument()

        // Sin foto guardada no hay botón de quitar.
        expect(screen.queryByRole('button', { name: 'Quitar foto' })).not.toBeInTheDocument()
    })

    it('selecciona un PNG válido: previsualiza y al guardar sube la foto antes del PUT', async () => {
        prepararUsuario()
        const llamadas = []
        global.fetch = crearFetch(llamadas)

        render(<MiPerfil />)
        const input = await screen.findByLabelText('Foto de perfil')

        const archivo = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'avatar.png', {
            type: 'image/png',
        })
        fireEvent.change(input, { target: { files: [archivo] } })

        // Vista previa local en dataURL, sin haber llamado al backend.
        const vista = await screen.findByAltText('Foto de perfil')
        expect(vista.getAttribute('src')).toMatch(/^data:image\/png/)
        expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false)

        fireEvent.submit(input.closest('form'))

        await waitFor(() => {
            expect(llamadas.some((l) => l.metodo === 'PUT' && l.ruta.endsWith('/Usuarios/perfil'))).toBe(true)
        })

        const post = llamadas.find((l) => l.metodo === 'POST' && l.ruta.endsWith('/Usuarios/foto'))
        const put = llamadas.find((l) => l.metodo === 'PUT')

        // Orden del flujo: POST foto primero, PUT perfil después.
        expect(post).toBeTruthy()
        expect(llamadas.indexOf(post)).toBeLessThan(llamadas.indexOf(put))

        expect(post.opciones.body).toBeInstanceOf(FormData)
        expect(post.opciones.body.get('archivo')).toBeInstanceOf(File)

        // El PUT lleva la ruta devuelta por el backend y localStorage queda
        // sincronizado con esa misma fotoPerfil.
        expect(JSON.parse(put.opciones.body).fotoPerfil).toBe('/api/Usuarios/foto/1')
        expect(JSON.parse(localStorage.getItem('usuario')).fotoPerfil).toBe('/api/Usuarios/foto/1')
    })

    it('rechaza un tipo no permitido en el cliente sin llamar al backend', async () => {
        prepararUsuario()
        global.fetch = crearFetch()

        render(<MiPerfil />)
        const input = await screen.findByLabelText('Foto de perfil')
        global.fetch.mockClear()

        const archivo = new File([new Uint8Array([1])], 'documento.gif', { type: 'image/gif' })
        fireEvent.change(input, { target: { files: [archivo] } })

        expect(await screen.findByText('Solo se admiten imágenes PNG o JPG.')).toBeInTheDocument()
        expect(screen.queryByAltText('Foto de perfil')).not.toBeInTheDocument()
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('rechaza un archivo mayor a 5 MB en el cliente sin llamar al backend', async () => {
        prepararUsuario()
        global.fetch = crearFetch()

        render(<MiPerfil />)
        const input = await screen.findByLabelText('Foto de perfil')
        global.fetch.mockClear()

        const archivo = new File([new ArrayBuffer(6 * 1024 * 1024)], 'grande.png', {
            type: 'image/png',
        })
        fireEvent.change(input, { target: { files: [archivo] } })

        expect(await screen.findByText('La imagen no puede superar 5 MB.')).toBeInTheDocument()
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('reduce la imagen con canvas a 512×512 en JPEG antes de subirla', async () => {
        prepararUsuario()
        const llamadas = []
        global.fetch = crearFetch(llamadas)

        // jsdom no implementa createObjectURL ni canvas: se stubbean los
        // objetos del entorno para ejercitar el camino de resize real.
        const drawImage = vi.fn()
        class URLFalsa {
            static createObjectURL() {
                return 'blob:foto-falsa'
            }
            static revokeObjectURL() {}
        }
        class ImagenFalsa {
            constructor() {
                this.naturalWidth = 1000
                this.naturalHeight = 800
            }
            set src(_valor) {
                queueMicrotask(() => this.onload?.())
            }
        }
        vi.stubGlobal('URL', URLFalsa)
        vi.stubGlobal('Image', ImagenFalsa)
        vi.spyOn(window.HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({ drawImage }))
        vi.spyOn(window.HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(
            () => `data:image/jpeg;base64,${btoa('bytes-reducidos')}`
        )

        render(<MiPerfil />)
        const input = await screen.findByLabelText('Foto de perfil')

        const archivo = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'avatar.png', {
            type: 'image/png',
        })
        fireEvent.change(input, { target: { files: [archivo] } })

        await waitFor(() => expect(drawImage).toHaveBeenCalled())
        // 1000×800 → escala 512/1000 = 0.512 → 512×410 (redondeo, lado
        // mayor toca el tope de 512 y la proporción se conserva).
        expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 512, 410)

        fireEvent.submit(input.closest('form'))

        await waitFor(() => {
            expect(llamadas.some((l) => l.metodo === 'POST' && l.ruta.endsWith('/Usuarios/foto'))).toBe(true)
        })

        const post = llamadas.find((l) => l.metodo === 'POST')
        const subido = post.opciones.body.get('archivo')
        expect(subido).toBeInstanceOf(File)
        expect(subido.type).toBe('image/jpeg')
        expect(subido.name).toBe('avatar.jpg')
    })

    it('quitar foto llama al DELETE, limpia el estado y vuelve a las iniciales', async () => {
        prepararUsuario({ fotoPerfil: '/api/Usuarios/foto/1' })
        const llamadas = []
        global.fetch = crearFetch(llamadas)

        render(<MiPerfil />)

        const boton = await screen.findByRole('button', { name: 'Quitar foto' })
        expect(screen.getByAltText('Foto de perfil')).toBeInTheDocument()

        fireEvent.click(boton)

        await waitFor(() => {
            expect(
                llamadas.some((l) => l.metodo === 'DELETE' && l.ruta.endsWith('/Usuarios/foto'))
            ).toBe(true)
        })

        // localStorage sincronizado al momento del borrado (sin Guardar cambios).
        expect(JSON.parse(localStorage.getItem('usuario')).fotoPerfil).toBeNull()
        expect(await screen.findByText('AD')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Quitar foto' })).not.toBeInTheDocument()
        expect(screen.queryByAltText('Foto de perfil')).not.toBeInTheDocument()
    })

    it('muestra las iniciales cuando el usuario no tiene foto', async () => {
        prepararUsuario()
        global.fetch = crearFetch()

        render(<MiPerfil />)

        expect(await screen.findByText('Información personal')).toBeInTheDocument()
        expect(screen.getByText('AD')).toBeInTheDocument()
        expect(screen.queryByAltText('Foto de perfil')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Quitar foto' })).not.toBeInTheDocument()
    })
})
