import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import Login from './Login'

// T1: "Olvidé mi contraseña" dejó de usar window.prompt/window.alert y de
// pegar un fetch crudo en el JSX. Este test fija el contrato nuevo:
// formulario inline en la propia pantalla de Login + authApi.solicitarReset
// (POST /api/Auth/solicitar-reset) + Notification con el mensaje del backend.

const MENSAJE_BACKEND =
    'Si el correo existe, recibirás un enlace para restablecer tu contraseña.'

const fetchOriginal = global.fetch

afterEach(() => {
    cleanup()
    global.fetch = fetchOriginal
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

function respuesta(cuerpo, status = 200) {
    return new Response(JSON.stringify(cuerpo), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

async function abrirFormularioReset() {
    render(<Login onLogin={() => {}} irRegistro={() => {}} />)

    fireEvent.click(
        screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' })
    )

    return screen.getByLabelText('Correo electrónico')
}

describe('Login — olvidé mi contraseña', () => {
    it('muestra el formulario inline, llama a la API y presenta el mensaje del backend', async () => {
        const promptSpy = vi.spyOn(window, 'prompt')
        const alertSpy = vi.spyOn(window, 'alert')

        const fetchSpy = vi.fn(async (url) =>
            String(url).includes('solicitar-reset')
                ? respuesta({ message: MENSAJE_BACKEND })
                : respuesta({})
        )
        global.fetch = fetchSpy

        const campo = await abrirFormularioReset()

        // El campo es un email real con label asociado (sin prompts nativos).
        expect(campo).toHaveAttribute('type', 'email')

        fireEvent.change(campo, { target: { value: 'ana@gmail.com' } })
        fireEvent.submit(campo.closest('form'))

        await waitFor(() =>
            expect(fetchSpy).toHaveBeenCalledWith(
                '/api/Auth/solicitar-reset',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo: 'ana@gmail.com' }),
                })
            )
        )

        expect(await screen.findByRole('alert')).toHaveTextContent(
            MENSAJE_BACKEND
        )

        expect(promptSpy).not.toHaveBeenCalled()
        expect(alertSpy).not.toHaveBeenCalled()
    })

    it('valida el correo vacío en el formulario de reset sin llamar a la API', async () => {
        const fetchSpy = vi.fn()
        global.fetch = fetchSpy

        const campo = await abrirFormularioReset()
        fireEvent.submit(campo.closest('form'))

        const alerta = await screen.findByRole('alert')
        expect(alerta).toHaveTextContent('Completa todos los campos.')
        expect(alerta).toHaveAttribute('id', 'login-error-campo')

        expect(
            fetchSpy.mock.calls.filter(([url]) =>
                String(url).includes('solicitar-reset')
            )
        ).toHaveLength(0)
    })

    it('vuelve al formulario de login con el botón Volver', async () => {
        // El nonce de Google nunca resuelve en este test: solo se prueba el
        // cambio de sección y el botón GIS no debe actualizar estado fuera
        // de act() mientras corre.
        global.fetch = vi.fn(() => new Promise(() => {}))

        const campo = await abrirFormularioReset()
        expect(campo).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Volver' }))

        expect(
            screen.queryByLabelText('Correo electrónico')
        ).toBeInTheDocument()
        // El formulario de login vuelve con su campo de contraseña.
        expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Enviar enlace' })
        ).not.toBeInTheDocument()
    })

    it('muestra un Notification de error cuando la solicitud falla, sin alert nativo', async () => {
        const alertSpy = vi.spyOn(window, 'alert')

        global.fetch = vi.fn(async (url) => {
            if (String(url).includes('solicitar-reset')) {
                throw new Error('Error de red')
            }
            return respuesta({})
        })

        const campo = await abrirFormularioReset()
        fireEvent.change(campo, { target: { value: 'ana@gmail.com' } })
        fireEvent.submit(campo.closest('form'))

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Error de red'
        )
        expect(alertSpy).not.toHaveBeenCalled()
    })
})
