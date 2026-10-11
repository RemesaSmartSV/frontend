import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './es.json'
import en from './en.json'

// Idioma inicial: preferencia del perfil > localStorage > navegador > 'es'
function idiomaInicial() {
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
        if (usuario?.idiomaPreferido) return usuario.idiomaPreferido
    } catch { /* corrupto */ }
    return localStorage.getItem('idioma') || navigator.language?.slice(0, 2) || 'es'
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
