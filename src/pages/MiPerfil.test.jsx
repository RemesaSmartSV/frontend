import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import MiPerfil from './MiPerfil'

// La página lee la sesión de localStorage (clave 'usuario', la misma que
// escribe authApi.login) y consulta GET /api/Hogares para el nombre del
// hogar. No hay edición de correo, contraseña ni rol: no existen endpoints.

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

describe('MiPerfil', () => {
    it('muestra correo, rol y hogar en solo lectura con el botón Guardar', async () => {
        localStorage.setItem(
            'usuario',
            JSON.stringify({
                idUsuario: 1,
                nombre: 'Ana',
                correo: 'ana@demo.com',
                rol: 'Admin',
                idHogar: 1,
            })
        )

        global.fetch = vi.fn(async (url) => {
            if (String(url).includes('/Hogares')) {
                return respuesta({
                    idHogar: 1,
                    nombreFamiliar: 'Familia Ana',
                })
            }

            return respuesta([])
        })

        render(<MiPerfil />)

        const correo = await screen.findByDisplayValue('ana@demo.com')
        expect(correo).toHaveAttribute('readonly')

        const rol = await screen.findByDisplayValue('Admin')
        expect(rol).toHaveAttribute('readonly')

        const hogar = await screen.findByDisplayValue('Familia Ana')
        expect(hogar).toHaveAttribute('readonly')

        expect(screen.getByLabelText('Nombre')).toHaveValue('Ana')
        expect(
            screen.getByRole('button', { name: 'Guardar cambios' })
        ).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    })

    it('muestra "Sin asignar" y "Sin hogar" cuando rol es null y el hogar no existe', async () => {
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

        // GET /api/Hogares responde 404 para cuentas sin hogar.
        global.fetch = vi.fn(async () =>
            respuesta({ message: 'No tienes un hogar.' }, 404)
        )

        render(<MiPerfil />)

        expect(await screen.findByDisplayValue('Sin asignar')).toBeInTheDocument()
        expect(await screen.findByDisplayValue('Sin hogar')).toBeInTheDocument()
    })
})
