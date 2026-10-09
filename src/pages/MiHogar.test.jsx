import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import MiHogar from './MiHogar'

// Stub de fetch por ruta: Hogares, Usuarios (miembros) e Invitaciones.
// El rol se lee de localStorage clave 'usuario' (la misma de authApi.login).

const fetchOriginal = global.fetch

function respuesta(cuerpo, status = 200) {
    return new Response(JSON.stringify(cuerpo), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

function sesion(rol) {
    localStorage.setItem(
        'usuario',
        JSON.stringify({ idUsuario: 1, nombre: 'Ana', correo: 'ana@demo.com', rol, idHogar: 1 })
    )
}

afterEach(() => {
    cleanup()
    global.fetch = fetchOriginal
    localStorage.clear()
})

function fetchFamilia(miembros, invitaciones = []) {
    return vi.fn(async (url, opciones = {}) => {
        const destino = String(url)

        if (destino.includes('/Invitaciones')) {
            if (opciones.method === 'POST') return respuesta({ idInvitacion: 5, estado: 'Pendiente' }, 201)
            return respuesta(invitaciones)
        }

        if (destino.includes('/Hogares')) {
            return respuesta({ idHogar: 1, nombreFamiliar: 'Familia Duarte' })
        }

        if (destino.includes('/Usuarios')) {
            return respuesta(miembros)
        }

        return respuesta([])
    })
}

describe('MiHogar', () => {
    it('muestra los miembros con rol y la invitación como Admin', async () => {
        sesion('Admin')
        global.fetch = fetchFamilia([
            { idUsuario: 1, nombre: 'Ana Duarte', correo: 'ana@demo.com', rol: 'Admin', fechaRegistro: '2026-01-10T00:00:00Z' },
            { idUsuario: 2, nombre: 'Beto Duarte', correo: 'beto@demo.com', rol: 'Miembro', fechaRegistro: '2026-02-01T00:00:00Z' },
        ])

        render(<MiHogar />)

        expect(await screen.findByText('Familia Duarte')).toBeInTheDocument()
        expect(await screen.findByText('Ana Duarte')).toBeInTheDocument()
        expect(screen.getByText('Beto Duarte')).toBeInTheDocument()
        expect(screen.getByText('Administrador')).toBeInTheDocument()
        expect(screen.getByText('Miembro')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Invitar' })).toBeInTheDocument()
    })

    it('oculta el formulario de invitación para un Miembro', async () => {
        sesion('Miembro')
        global.fetch = fetchFamilia([
            { idUsuario: 1, nombre: 'Ana Duarte', correo: 'ana@demo.com', rol: 'Admin', fechaRegistro: '2026-01-10T00:00:00Z' },
            { idUsuario: 2, nombre: 'Beto Duarte', correo: 'beto@demo.com', rol: 'Miembro', fechaRegistro: '2026-02-01T00:00:00Z' },
        ])

        render(<MiHogar />)

        await screen.findByText('Ana Duarte')

        expect(screen.queryByRole('button', { name: 'Invitar' })).not.toBeInTheDocument()
        expect(
            screen.getByText(/Solo un administrador/)
        ).toBeInTheDocument()
    })

    it('envía una invitación desde el formulario de Admin', async () => {
        sesion('Admin')
        const fetchMock = fetchFamilia([
            { idUsuario: 1, nombre: 'Ana Duarte', correo: 'ana@demo.com', rol: 'Admin', fechaRegistro: '2026-01-10T00:00:00Z' },
        ])
        global.fetch = fetchMock

        render(<MiHogar />)

        await screen.findByText('Ana Duarte')

        fireEvent.change(screen.getByLabelText('Correo de la persona a invitar'), {
            target: { value: 'carlos@demo.com' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Invitar' }))

        await waitFor(() =>
            expect(screen.getByText('Invitación enviada.')).toBeInTheDocument()
        )

        const llamada = fetchMock.mock.calls.find(([url, opciones]) =>
            String(url).includes('/Invitaciones') && opciones?.method === 'POST'
        )
        expect(llamada).toBeDefined()
        expect(JSON.parse(llamada[1].body).correo).toBe('carlos@demo.com')
    })
})
