import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { authApi } from '../services/api'
import Notification from '../components/Notification'

export default function Login({ onLogin, irRegistro }) {
    const { t } = useTranslation()
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [verContrasena, setVerContrasena] = useState(false)
    const [error, setError] = useState('')
    const [errorCampo, setErrorCampo] = useState('')
    const [cargando, setCargando] = useState(false)

    async function iniciarSesion(e) {
        e.preventDefault()
        setError('')
        setErrorCampo('')

        if (!correo.trim() || !contrasena.trim()) {
            setErrorCampo('Completa todos los campos.')
            return
        }

        setCargando(true)
        try {
            const datos = await authApi.login(correo.trim(), contrasena)
            onLogin(datos)
        } catch (err) {
            setError(err.message || 'No se pudo iniciar sesión. Verifica tus datos.')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="flex min-h-screen">
            {/* COLUMNA IZQUIERDA — Branding (solo desktop) */}
            <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:bg-[#123B8F] lg:p-12 lg:text-white">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">RemesaSmart SV</h1>
                    <p className="mt-2 text-lg text-blue-100">Tu familia, sus finanzas, un solo lugar.</p>
                </div>

                <div className="space-y-6">
                    {[
                        { icono: '💰', texto: 'Controla ingresos y gastos familiares' },
                        { icono: '🐷', texto: 'Crea metas de ahorro y sigue tu progreso' },
                        { icono: '👨‍👩‍👧', texto: 'Administra las finanzas de tu familia' },
                        { icono: '📊', texto: 'Visualiza tu situación financiera con gráficas' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">{item.icono}</span>
                            <p className="text-blue-100">{item.texto}</p>
                        </div>
                    ))}
                </div>

                <p className="text-sm text-blue-200">© 2026 RemesaSmart SV. Todos los derechos reservados.</p>
            </div>

            {/* COLUMNA DERECHA — Formulario */}
            <div className="flex w-full flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-slate-900 lg:w-1/2">
                <div className="w-full max-w-md">
                    {/* Logo móvil */}
                    <div className="mb-8 text-center lg:hidden">
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#123B8F] dark:text-blue-400">RemesaSmart SV</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tu familia, sus finanzas, un solo lugar.</p>
                    </div>

                    <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-100">{t('auth.login')}</h2>
                    <p className="mb-8 text-gray-500 dark:text-gray-400">{t('auth.login')}</p>

                    {error && <Notification tipo="error" mensaje={error} onClose={() => setError('')} />}

                    <form onSubmit={iniciarSesion} className="space-y-5">
                        {/* Correo */}
                        <div>
                            <label htmlFor="correo" className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t('auth.correo')}
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="correo"
                                    type="email"
                                    value={correo}
                                    onChange={(e) => { setCorreo(e.target.value); setErrorCampo('') }}
                                    placeholder="correo@gmail.com"
                                    autoComplete="email"
                                    required
                                    disabled={cargando}
                                    {...(errorCampo ? { 'aria-invalid': 'true', 'aria-describedby': 'login-error-campo' } : {})}
                                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
                                />
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label htmlFor="contrasena" className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t('auth.contrasena')}
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="contrasena"
                                    type={verContrasena ? 'text' : 'password'}
                                    value={contrasena}
                                    onChange={(e) => { setContrasena(e.target.value); setErrorCampo('') }}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                    disabled={cargando}
                                    {...(errorCampo ? { 'aria-invalid': 'true', 'aria-describedby': 'login-error-campo' } : {})}
                                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-12 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => setVerContrasena(!verContrasena)}
                                    aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {verContrasena ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Error de campo */}
                        {errorCampo && (
                            <p id="login-error-campo" role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                                {errorCampo}
                            </p>
                        )}

                        {/* Olvidé mi contraseña */}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    const c = window.prompt('Ingresa tu correo electrónico:')
                                    if (c) {
                                        fetch('/api/Auth/solicitar-reset', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ correo: c }),
                                        }).then(() => window.alert('Si el correo existe, recibirás un enlace.'))
                                    }
                                }}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                                {t('auth.olvidaste')}
                            </button>
                        </div>

                        {/* Botón submit */}
                        <button
                            type="submit"
                            disabled={cargando}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-base font-bold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {cargando ? (
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            ) : (
                                <ArrowRight size={18} />
                            )}
                            {cargando ? t('common.cargando') : t('auth.entrar')}
                        </button>
                    </form>

                    {/* Separador */}
                    <div className="my-6 flex items-center">
                        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                        <span className="px-3 text-sm text-gray-400">o</span>
                        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                    </div>

                    {/* Google */}
                    <button
                        type="button"
                        onClick={() => {
                            if (window.google?.accounts?.id) {
                                window.google.accounts.id.initialize({
                                    client_id: window.GOOGLE_CLIENT_ID || '',
                                    callback: async (response) => {
                                        try {
                                            const res = await fetch('/api/Auth/google', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ idToken: response.credential }),
                                            })
                                            const data = await res.json()
                                            if (data.token) {
                                                localStorage.setItem('token', data.token)
                                                localStorage.setItem('usuario', JSON.stringify(data))
                                                window.location.reload()
                                            } else {
                                                setError(data.message || 'No se pudo iniciar sesión con Google.')
                                            }
                                        } catch {
                                            setError('No se pudo iniciar sesión con Google.')
                                        }
                                    },
                                })
                                window.google.accounts.id.prompt()
                            } else {
                                setError('Google Sign-In no está disponible. Recarga la página.')
                            }
                        }}
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continuar con Google
                    </button>

                    {/* Registro */}
                    <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        {t('auth.noCuenta')}{' '}
                        <button
                            type="button"
                            onClick={irRegistro}
                            disabled={cargando}
                            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                            {t('auth.register')}
                        </button>
                    </p>

                    {/* Enlace presentación */}
                    <p className="mt-4 text-center">
                        <a href="/presentacion" className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500">
                            Conocer más sobre RemesaSmart SV
                        </a>
                    </p>

                    {/* Enlaces legales */}
                    <nav aria-label="Enlaces legales" className="mt-6 flex justify-center gap-x-4 text-xs text-gray-400 dark:text-gray-500">
                        <a href="/politica-de-privacidad" className="hover:text-gray-600">Política de privacidad</a>
                        <a href="/terminos-y-condiciones" className="hover:text-gray-600">Términos y condiciones</a>
                        <a href="/politica-de-cookies" className="hover:text-gray-600">Política de cookies</a>
                    </nav>
                </div>
            </div>
        </div>
    )
}
