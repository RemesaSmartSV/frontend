import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ tema: 'claro', cambiarTema: () => {} })

function resolverTema(preferencia) {
    if (preferencia === 'oscuro') return 'oscuro'
    if (preferencia === 'sistema') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'oscuro'
            : 'claro'
    }
    return 'claro'
}

export function ThemeProvider({ children }) {
    const [preferencia, setPreferencia] = useState(() => {
        // Lee de localStorage primero; si hay perfil guardado, lo usa.
        try {
            const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
            if (usuario?.temaPreferido) return usuario.temaPreferido
        } catch { /* corrupto */ }
        return localStorage.getItem('tema') || 'claro'
    })

    const tema = resolverTema(preferencia)

    useEffect(() => {
        const raiz = document.documentElement
        if (tema === 'oscuro') {
            raiz.classList.add('dark')
        } else {
            raiz.classList.remove('dark')
        }
    }, [tema])

    useEffect(() => {
        if (preferencia !== 'sistema') return
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => setPreferencia('sistema') // fuerza re-render
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [preferencia])

    function cambiarTema(nueva) {
        setPreferencia(nueva)
        localStorage.setItem('tema', nueva)
    }

    return (
        <ThemeContext.Provider value={{ tema, preferencia, cambiarTema }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}
