import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import MiPerfil from './MiPerfil'

// El perfil muestra datos personales editables, cuenta en solo lectura,
// y selectores de tema e idioma. El backend se stubbea con global.fetch.

const fetchOriginal = global.fetch

function respuesta(cuerpo, status = 200) {
    return new Response(JSON.stringify(cuerpo), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

afterEach(() => {
    cleanup()
    global.fetch = fetchOriginal
    localStorage.clear()
})

function fetchPerfil(hogar = { idHogar: 1, nombreFamiliar: 'Familia Ana' }) {
    return vi.fn(async (url) => {
        if (String(url).includes('/Hogares')) return respuesta(hogar)
        return respuesta([])
    })
}

describe('MiPerfil', () => {
    it('muestra secciones de información personal, cuenta, apariencia e idioma', async () => {
        localStorage.setItem(
            'usuario',
            JSON.stringify({
                idUsuario: 1,
                nombre: 'Ana',
                apellido: 'Duarte',
                correo: 'ana@demo.com',
                rol: 'Admin',
                idHogar: 1,
            })
        )
        global.fetch = fetchPerfil()

        render(<MiPerfil />)

        expect(await screen.findByText('Información personal')).toBeInTheDocument()
        expect(screen.getByText('Cuenta')).toBeInTheDocument()
        expect(screen.getByText('Apariencia')).toBeInTheDocument()
        expect(screen.getByText('Idioma')).toBeInTheDocument()

        // Cuenta en solo lectura
        expect(screen.getByText('ana@demo.com')).toBeInTheDocument()
        // El rol se traduce con family.admin; el backend envía el código 'Admin'.
        expect(screen.getByText('Administrador')).toBeInTheDocument()
        expect(screen.getByText('Familia Ana')).toBeInTheDocument()
    })

    it('muestra "Sin asignar" y "Sin hogar" cuando rol es null y no hay hogar', async () => {
        localStorage.setItem(
            'usuario',
            JSON.stringify({
                idUsuario: 2,
                nombre: 'Beto',
                correo: 'beto@demo.com',
                rol: null,
                idHogar: null,
            })
        )
        global.fetch = vi.fn(async () => respuesta({ message: 'No tienes un hogar.' }, 404))

        render(<MiPerfil />)

        expect(await screen.findByText('Sin asignar')).toBeInTheDocument()
        expect(screen.getByText('Sin hogar')).toBeInTheDocument()
    })

    it('tiene botones de tema e idioma con aria-pressed', async () => {
        localStorage.setItem(
            'usuario',
            JSON.stringify({ idUsuario: 1, nombre: 'Ana', correo: 'a@a.com', rol: 'Miembro', idHogar: 1 })
        )
        global.fetch = fetchPerfil()

        render(<MiPerfil />)

        expect(await screen.findByText('Información personal')).toBeInTheDocument()

        const temaClaro = screen.getByRole('button', { name: /Claro/ })
        expect(temaClaro).toHaveAttribute('aria-pressed', 'true')

        const idiomaEs = screen.getByRole('button', { name: 'Español' })
        expect(idiomaEs).toHaveAttribute('aria-pressed', 'true')
    })

    it('tiene botones Guardar cambios y Cancelar', async () => {
        localStorage.setItem(
            'usuario',
            JSON.stringify({ idUsuario: 1, nombre: 'Ana', correo: 'a@a.com', rol: 'Miembro', idHogar: 1 })
        )
        global.fetch = fetchPerfil()

        render(<MiPerfil />)

        expect(await screen.findByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    })
})
