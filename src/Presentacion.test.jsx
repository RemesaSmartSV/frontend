import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import Presentacion from './pages/Presentacion'
import App from './App'

// La presentacion navega con scrollIntoView, que jsdom no implementa.
const scrollIntoView = vi.fn()

beforeEach(() => {
    Element.prototype.scrollIntoView = scrollIntoView
    scrollIntoView.mockClear()
})

afterEach(() => {
    cleanup()
    document.body.style.overflow = ''
    window.history.pushState({}, '', '/')
})

describe('Presentacion comercial', () => {
    it('renderiza las seis secciones con su titulo', () => {
        const { container } = render(<Presentacion />)

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: /RemesaSmart SV/i,
            })
        ).toBeInTheDocument()

        // <section> con aria-label expone el rol "region" en ARIA.
        expect(screen.getAllByRole('region')).toHaveLength(6)
        expect(container.querySelectorAll('section')).toHaveLength(6)
    })

    it('expone la navegacion por botones y puntos de seccion', () => {
        render(<Presentacion />)

        expect(
            screen.getByRole('button', { name: 'Sección anterior' })
        ).toBeDisabled()

        expect(
            screen.getByRole('button', { name: 'Sección siguiente' })
        ).toBeEnabled()

        expect(screen.getAllByRole('button', { name: /^Ir a / })).toHaveLength(
            6
        )

        // Indicador de progreso: arranca en la primera seccion.
        expect(screen.getByText(/01/)).toBeInTheDocument()
    })

    it('avanza de seccion con el boton Siguiente', () => {
        render(<Presentacion />)

        fireEvent.click(
            screen.getByRole('button', { name: 'Sección siguiente' })
        )

        expect(scrollIntoView).toHaveBeenCalledTimes(1)
        expect(scrollIntoView).toHaveBeenCalledWith(
            expect.objectContaining({ block: 'start' })
        )
    })

    it('avanza de seccion con la flecha derecha del teclado', () => {
        render(<Presentacion />)

        fireEvent.keyDown(window, { key: 'ArrowRight' })

        expect(scrollIntoView).toHaveBeenCalledTimes(1)
    })

    it('no presenta las metas de ahorro como una interfaz terminada', () => {
        render(<Presentacion />)

        // Aparece en la lista de capacidades, en el paso 3 y en el beneficio.
        expect(
            screen.getAllByText(/interfaz en desarrollo/i).length
        ).toBeGreaterThanOrEqual(2)
    })

    it('sin session sigue siendo una vista publica que enlaza al login', () => {
        render(<Presentacion />)

        const enlace = screen.getByRole('link', {
            name: /Conoce RemesaSmart SV/i,
        })

        expect(enlace).toHaveAttribute('href', '/')
    })
})

describe('Presentacion como vista publica de App', () => {
    it('App monta la presentacion en /presentacion sin sesion', () => {
        window.history.pushState({}, '', '/presentacion')

        render(<App />)

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: /RemesaSmart SV/i,
            })
        ).toBeInTheDocument()

        // No debe caer en el login.
        expect(
            screen.queryByRole('button', { name: /Iniciar sesión/i })
        ).not.toBeInTheDocument()
    })

    it('App sigue mostrando el login en / sin sesion', async () => {
        window.history.pushState({}, '', '/')

        render(<App />)

        expect(
            await screen.findByRole('button', { name: /Iniciar sesión/i })
        ).toBeInTheDocument()
    })
})
