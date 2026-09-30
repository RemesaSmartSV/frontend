import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import App from './App'

// Las páginas legales deben poder leerse SIN sesión iniciada: se resuelven
// antes del router, igual que la presentación comercial. Este test monta
// <App/> en cada ruta sin token para asegurar que siguen siendo accesibles.

const PAGINAS = [
    { ruta: '/politica-de-privacidad', titulo: /Política de privacidad/i },
    { ruta: '/terminos-y-condiciones', titulo: /Términos y condiciones/i },
    { ruta: '/politica-de-cookies', titulo: /Política de cookies/i },
]

afterEach(() => {
    cleanup()
    localStorage.clear()
    window.history.pushState({}, '', '/')
})

describe('Páginas legales', () => {
    it.each(PAGINAS)('$ruta se renderiza sin sesión', async ({ ruta, titulo }) => {
        window.history.pushState({}, '', ruta)

        render(<App />)

        expect(
            await screen.findByRole('heading', { level: 1, name: titulo })
        ).toBeInTheDocument()

        // Debe existir una vuelta al inicio.
        expect(
            screen.getByRole('link', { name: /Volver a RemesaSmart SV/i })
        ).toHaveAttribute('href', '/')
    })

    it('el login enlaza a las tres páginas legales', async () => {
        window.history.pushState({}, '', '/')

        render(<App />)

        const nav = await screen.findByRole('navigation', {
            name: /Enlaces legales/i,
        })

        expect(
            screen.getByRole('link', { name: 'Privacidad' })
        ).toHaveAttribute('href', '/politica-de-privacidad')
        expect(
            screen.getByRole('link', { name: /Términos y condiciones/i })
        ).toHaveAttribute('href', '/terminos-y-condiciones')
        expect(
            screen.getByRole('link', { name: /Política de cookies/i })
        ).toHaveAttribute('href', '/politica-de-cookies')
        expect(nav).toBeInTheDocument()
    })
})
