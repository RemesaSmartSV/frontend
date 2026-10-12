import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import Register from './Register'

// El registro ya NO pide nombre familiar: el hogar se crea después, en la
// pantalla "HogarPendiente", con el LoginResponse del login.

const fetchOriginal = global.fetch

afterEach(() => {
    cleanup()
    global.fetch = fetchOriginal
    vi.unstubAllGlobals()
})

describe('Registro sin campo de familia', () => {
    it('el formulario no tiene ningún input de nombre familiar', () => {
        render(<Register volverLogin={() => {}} />)

        expect(
            screen.queryByLabelText(/nombre familiar/i)
        ).not.toBeInTheDocument()
        expect(
            document.querySelector('input[name="nombreFamiliar"]')
        ).toBeNull()
        expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument()
    })

    it('marca aria-invalid en la confirmación al discrepar las claves y no envía el request', async () => {
        const fetchSpy = vi.fn()
        global.fetch = fetchSpy

        render(<Register volverLogin={() => {}} />)

        fireEvent.change(screen.getByLabelText('Nombre'), {
            target: { value: 'Ana' },
        })
        fireEvent.change(screen.getByLabelText('Correo'), {
            target: { value: 'ana@gmail.com' },
        })
        fireEvent.change(screen.getByLabelText('Contraseña'), {
            target: { value: 'claveSegura1' },
        })
        fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
            target: { value: 'otraClave2' },
        })

        fireEvent.submit(
            screen.getByRole('button', { name: 'Crear cuenta' }).closest('form')
        )

        const alerta = await screen.findByRole('alert')
        expect(alerta).toHaveTextContent('Las contraseñas no coinciden.')

        const confirmacion = screen.getByLabelText('Confirmar contraseña')
        expect(confirmacion).toHaveAttribute('aria-invalid', 'true')
        expect(confirmacion).toHaveAttribute(
            'aria-describedby',
            'registro-error-campo'
        )

        // La validación local corta el request: no hay POST /Auth/register.
        expect(fetchSpy).not.toHaveBeenCalled()
    })
})
