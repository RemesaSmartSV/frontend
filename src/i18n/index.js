import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './es.json'
import en from './en.json'

export const IDIOMAS_SOPORTADOS = ['es', 'en']

export function normalizarIdioma(idioma) {
    const normalizado = String(idioma || '').toLowerCase().split(/[-_]/)[0]
    return IDIOMAS_SOPORTADOS.includes(normalizado) ? normalizado : null
}

// Preference order: signed-in profile > local choice > supported browser language > Spanish.
function idiomaInicial() {
    try {
        const token = localStorage.getItem('token')
        const usuarioGuardado = localStorage.getItem('usuario')
        if (token && usuarioGuardado) {
            const tokenPayload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
            if (tokenPayload) {
                const payload = JSON.parse(atob(tokenPayload))
                if (Number(payload.exp) * 1000 > Date.now()) {
                    const usuario = JSON.parse(usuarioGuardado)
                    const perfil = normalizarIdioma(usuario?.idiomaPreferido)
                    if (perfil) return perfil
                }
            }
        }
    } catch { /* Corrupt token, storage, or cached profile. */ }

    try {
        const guardado = normalizarIdioma(localStorage.getItem('idioma'))
        if (guardado) return guardado
    } catch { /* Storage is unavailable. */ }

    try {
        const navegador = normalizarIdioma(navigator.language)
        if (navegador) return navegador
    } catch { /* Browser language unavailable. */ }
    return 'es'
}

i18n.use(initReactI18next).init({
    resources: {
        es: { translation: es },
        en: { translation: en },
    },
    lng: idiomaInicial(),
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
})

export default i18n

i18n.on('languageChanged', (idioma) => {
    const idiomaValido = normalizarIdioma(idioma) || 'es'
    document.documentElement.lang = idiomaValido
    try {
        localStorage.setItem('idioma', idiomaValido)
    } catch { /* Language change still applies for this session. */ }
})

document.documentElement.lang = normalizarIdioma(i18n.resolvedLanguage) || 'es'
