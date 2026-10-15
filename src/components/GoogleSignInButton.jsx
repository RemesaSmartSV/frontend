import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

/** Renders the official GIS button. This callback/ID-token flow has no OAuth redirect URI. */
export default function GoogleSignInButton({ onCredential, onError, disabled = false }) {
    const { t } = useTranslation()
    const hostRef = useRef(null)
    const handlersRef = useRef({ onCredential, onError })
    const [message, setMessage] = useState('')

    handlersRef.current = { onCredential, onError }

    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
        if (!clientId) {
            const error = t('google.clientMissing')
            setMessage(error)
            return undefined
        }

        let disposed = false

        async function configureGoogleButton() {
            try {
                // El servidor emite nonce corto y de un solo uso para evitar replay del ID token.
                const nonceResponse = await fetch('/api/Auth/google-nonce', { cache: 'no-store' })
                const nonceData = await nonceResponse.json()
                if (!nonceResponse.ok || !nonceData.nonce)
                    throw new Error(nonceData.message || t('google.verificationError'))

                const gis = window.google?.accounts?.id
                if (!gis)
                    throw new Error(t('google.scriptError'))
                if (disposed || !hostRef.current) return

                gis.initialize({
                    client_id: clientId,
                    nonce: nonceData.nonce,
                    ux_mode: 'popup',
                    context: 'signin',
                    callback: async (response) => {
                        if (!response?.credential) {
                            handlersRef.current.onError?.(t('google.credentialError'))
                            return
                        }
                        try {
                            await handlersRef.current.onCredential?.(response.credential, nonceData.nonce)
                        } catch (error) {
                            handlersRef.current.onError?.(error.message || t('auth.googleLoginError'))
                        }
                    },
                })

                gis.renderButton(hostRef.current, {
                    type: 'standard',
                    theme: document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    width: Math.max(hostRef.current.clientWidth, 240),
                    logo_alignment: 'left',
                })
                setMessage('')
            } catch (error) {
                if (disposed) return
                const message = error.message || t('google.unavailable')
                setMessage(message)
            }
        }

        configureGoogleButton()
        return () => {
            disposed = true
            if (hostRef.current) hostRef.current.replaceChildren()
        }
    }, [t])

    return (
        <div className={`w-full ${disabled ? 'pointer-events-none opacity-60' : ''}`} aria-busy={disabled}>
            <div ref={hostRef} className="flex min-h-10 justify-center" />
            {message && (
                <p role="status" className="mt-2 text-center text-xs text-amber-700 dark:text-amber-300">
                    {message}
                </p>
            )}
        </div>
    )
}
