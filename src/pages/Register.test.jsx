import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
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

        fireEvent.change(screen.getByLabelText('Nombre completo'), {
            target: { value: 'Ana' },
        })
        fireEvent.change(screen.getByLabelText('Correo electrónico'), {
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
        // El botón de Google (nuevo en Register) sí pide su nonce al montar;
        // esa llamada no cuenta como registro.
        const llamadasRegistro = fetchSpy.mock.calls.filter(([url]) =>
            String(url).includes('/Auth/register')
        )
        expect(llamadasRegistro).toHaveLength(0)
    })
})

describe('Registro con Google', () => {
    it('monta el botón de Google y pide su nonce al cargar', async () => {
        // El client ID de GIS viene del entorno de test (backend/.env vía
        // vite.config), así que el botón montado dispara el flujo de nonce.
        const fetchSpy = vi.fn(async (url) =>
            String(url).includes('google-nonce')
                ? new Response(JSON.stringify({ nonce: 'nonce-de-prueba' }), {
                      status: 200,
                      headers: { 'Content-Type': 'application/json' },
                  })
                : new Response(JSON.stringify({}), {
                      status: 200,
                      headers: { 'Content-Type': 'application/json' },
                  })
        )
        global.fetch = fetchSpy

        render(<Register volverLogin={() => {}} onLogin={() => {}} />)

        await waitFor(() =>
            expect(
                fetchSpy.mock.calls.some(([url]) =>
                    String(url).includes('/api/Auth/google-nonce')
                )
            ).toBe(true)
        )
    })
})

describe('Registro con sesión activa', () => {
    it('llama a onLogin con la respuesta completa cuando el registro sale bien', async () => {
        const onLogin = vi.fn()
        const cuerpo = {
            idUsuario: 9,
            nombre: 'Ana',
            correo: 'ana@gmail.com',
            token: 'jwt-de-registro',
            rol: null,
            idHogar: null,
        }
        global.fetch = vi.fn(async () =>
            new Response(JSON.stringify(cuerpo), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        )

        render(<Register volverLogin={() => {}} onLogin={onLogin} />)

        // The fields are located by name attribute so this test does not
        // depend on the visible label text of any language.
        fireEvent.change(document.querySelector('input[name="nombre"]'), {
            target: { value: 'Ana' },
        })
        fireEvent.change(document.querySelector('input[name="correo"]'), {
            target: { value: 'ana@gmail.com' },
        })
        fireEvent.change(document.querySelector('input[name="contrasena"]'), {
            target: { value: 'claveSegura1' },
        })
        fireEvent.change(
            document.querySelector('input[name="confirmarContrasena"]'),
            { target: { value: 'claveSegura1' } }
        )

        fireEvent.submit(document.querySelector('form'))

        await waitFor(() => expect(onLogin).toHaveBeenCalledWith(cuerpo))
    })
})
