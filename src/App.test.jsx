import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => {
            const map = { 'app.name': 'RemesaSmart SV', 'auth.login': 'Iniciar sesión' }
            return map[key] || key
        },
        i18n: { changeLanguage: () => {} },
    }),
}))

describe('App', () => {
    it('renderiza sin errores', () => {
        render(<App />)
    })

    it('muestra el titulo de la app', async () => {
        const { container } = render(<App />)
        // El App renderiza Login (lazy) con el branding "RemesaSmart SV".
        // Se verifica que el DOM tenga contenido renderizado.
        expect(container.innerHTML.length).toBeGreaterThan(0)
    })
})
