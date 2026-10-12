import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor, cleanup } from '@testing-library/react'
import GoogleSignInButton from './GoogleSignInButton'

describe('GoogleSignInButton', () => {
    const originalFetch = global.fetch

    afterEach(() => {
        cleanup()
        delete window.google
        global.fetch = originalFetch
    })

    it('inicializa GIS, renderiza el botón oficial y entrega el ID token al callback', async () => {
        let gisConfig
        const renderButton = vi.fn()
        window.google = {
            accounts: {
                id: {
                    initialize: vi.fn((config) => { gisConfig = config }),
                    renderButton,
                },
            },
        }
        const onCredential = vi.fn().mockResolvedValue(undefined)
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ nonce: 'single-use-nonce' }) })

        render(<GoogleSignInButton onCredential={onCredential} onError={vi.fn()} />)

        await waitFor(() => expect(renderButton).toHaveBeenCalledOnce())
        expect(window.google.accounts.id.initialize).toHaveBeenCalledWith(
            expect.objectContaining({ ux_mode: 'popup', callback: expect.any(Function) })
        )
        expect(renderButton.mock.calls[0][1]).toMatchObject({ type: 'standard', text: 'continue_with' })

        expect(gisConfig.nonce).toBe('single-use-nonce')
        await gisConfig.callback({ credential: 'google-id-token' })
        expect(onCredential).toHaveBeenCalledWith('google-id-token', 'single-use-nonce')
    })

    it('no simula éxito cuando GIS no está cargado', async () => {
        const onError = vi.fn()
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ nonce: 'single-use-nonce' }) })
        const { findByRole } = render(<GoogleSignInButton onCredential={vi.fn()} onError={onError} />)

        const status = await findByRole('status')
        expect(status.textContent).toMatch(/Google Sign-In/i)
        expect(onError).not.toHaveBeenCalled()
    })
})
