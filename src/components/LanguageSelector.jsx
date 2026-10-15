import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { usuariosApi } from '../services/api'

const LANGUAGES = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
]
let guardarPreferenciaPendiente = Promise.resolve()

export default function LanguageSelector({ className = '' }) {
    const { i18n, t } = useTranslation()
    const [errorGuardado, setErrorGuardado] = useState(false)
    const currentLanguage = String(i18n.resolvedLanguage || i18n.language || 'es')
        .toLowerCase()
        .split(/[-_]/)[0]

    function seleccionarIdioma(idioma) {
        i18n.changeLanguage(idioma)
        setErrorGuardado(false)

        let usuarioActual
        try {
            usuarioActual = JSON.parse(localStorage.getItem('usuario') || 'null')
        } catch {
            return
        }
        if (!localStorage.getItem('token') || !usuarioActual?.idUsuario) return

        const idUsuario = usuarioActual.idUsuario
        guardarPreferenciaPendiente = guardarPreferenciaPendiente
            .catch(() => {})
            .then(async () => {
                const usuarioEnStorage = JSON.parse(localStorage.getItem('usuario') || 'null')
                if (!localStorage.getItem('token') || usuarioEnStorage?.idUsuario !== idUsuario) return

                await usuariosApi.actualizarIdioma(idioma)

                const usuarioActualizado = JSON.parse(localStorage.getItem('usuario') || 'null')
                if (usuarioActualizado?.idUsuario === idUsuario) {
                    localStorage.setItem('usuario', JSON.stringify({
                        ...usuarioActualizado,
                        idiomaPreferido: idioma,
                    }))
                }
            })
            .catch(() => setErrorGuardado(true))
    }

    return (
        <div className={`inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 ${className}`} role="group" aria-label={t('profile.language')}>
            {LANGUAGES.map((language) => (
                <button
                    key={language.code}
                    type="button"
                    onClick={() => seleccionarIdioma(language.code)}
                    aria-pressed={currentLanguage === language.code}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${currentLanguage === language.code ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    {language.code.toUpperCase()}
                </button>
            ))}
            {errorGuardado && (
                <span role="status" className="ml-2 rounded bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
                    {t('languagePreference.syncError')}
                </span>
            )}
        </div>
    )
}
