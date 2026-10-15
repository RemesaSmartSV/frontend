import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import i18n, { normalizarIdioma } from '../i18n/index.js'
import LanguageSelector from './LanguageSelector'

const fetchOriginal = global.fetch

afterEach(async () => {
    cleanup()
    global.fetch = fetchOriginal
    localStorage.clear()
    await i18n.changeLanguage('es')
})

describe('language preference', () => {
    it('normalizes only the supported Spanish and English locales', () => {
        expect(normalizarIdioma('ES-sv')).toBe('es')
        expect(normalizarIdioma('en-US')).toBe('en')
        expect(normalizarIdioma('fr-FR')).toBeNull()
    })

    it('applies a selection immediately and persists it to the signed-in profile', async () => {
        const tokenPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
        localStorage.setItem('token', `header.${tokenPayload}.signature`)
        localStorage.setItem('idioma', 'es')
        localStorage.setItem('usuario', JSON.stringify({ idUsuario: 42, idiomaPreferido: 'es' }))

        global.fetch = vi.fn(async () => new Response(null, { status: 204 }))

        render(<LanguageSelector />)
        fireEvent.click(screen.getByRole('button', { name: 'EN' }))

        expect(document.documentElement.lang).toBe('en')
        expect(localStorage.getItem('idioma')).toBe('en')
        expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/Usuarios/idioma',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({ idiomaPreferido: 'en' }),
                })
            )
        })
        expect(JSON.parse(localStorage.getItem('usuario')).idiomaPreferido).toBe('en')
    })
})
