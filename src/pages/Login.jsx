import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { authApi } from '../services/api'
import Notification from '../components/Notification'
import GoogleSignInButton from '../components/GoogleSignInButton'
import LanguageSelector from '../components/LanguageSelector'

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
            setErrorCampo(t('auth.completeFields'))
            return
        }
        if (!correo.trim().toLowerCase().endsWith('@gmail.com')) {
            setError(t('auth.gmailOnly'))
            return
        }

        setCargando(true)
        try {
            const datos = await authApi.login(correo.trim(), contrasena)
            onLogin(datos)
        } catch (err) {
            setError(err.message || t('auth.loginError'))
        } finally {
            setCargando(false)
        }
    }

    async function iniciarConGoogle(idToken, nonce) {
        setError('')
        setCargando(true)
        try {
            const datos = await authApi.loginConGoogle(idToken, nonce)
            onLogin(datos)
        } catch (err) {
            setError(err.message || t('auth.googleLoginError'))
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
                    <p className="mt-2 text-lg text-blue-100">{t('auth.tagline')}</p>
                </div>

                <div className="space-y-6">
                    {[
                        { icono: '💰', texto: t('auth.benefitTransactions') },
                        { icono: '🐷', texto: t('auth.benefitSavings') },
                        { icono: '👨‍👩‍👧', texto: t('auth.benefitFamily') },
                        { icono: '📊', texto: t('auth.benefitCharts') },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">{item.icono}</span>
                            <p className="text-blue-100">{item.texto}</p>
                        </div>
                    ))}
                </div>

                <p className="text-sm text-blue-200">{t('auth.copyright')}</p>
            </div>

            {/* COLUMNA DERECHA — Formulario */}
            <div className="flex w-full flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-slate-900 lg:w-1/2">
                <div className="w-full max-w-md">
                    <div className="mb-4 flex justify-end">
                        <LanguageSelector />
                    </div>
                    {/* Logo móvil */}
                    <div className="mb-8 text-center lg:hidden">
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#123B8F] dark:text-blue-400">RemesaSmart SV</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('auth.tagline')}</p>
                    </div>

                    <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-100">{t('auth.login')}</h2>
                    <p className="mb-8 text-gray-500 dark:text-gray-400">{t('auth.loginSubtitle')}</p>

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
                                    aria-label={verContrasena ? t('auth.hidePassword') : t('auth.showPassword')}
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
                        <span className="px-3 text-sm text-gray-400">{t('auth.or')}</span>
                        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                    </div>

                    {/* Botón oficial de Google Identity Services; no utiliza redirect URI. */}
                    <GoogleSignInButton
                        onCredential={iniciarConGoogle}
                        onError={setError}
                        disabled={cargando}
                    />

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
                            {t('auth.learnMore')}
                        </a>
                    </p>

                    {/* Enlaces legales */}
                    <nav aria-label={t('shell.legalLinks')} className="mt-6 flex justify-center gap-x-4 text-xs text-gray-400 dark:text-gray-500">
                        <a href="/politica-de-privacidad" className="hover:text-gray-600">{t('shell.privacy')}</a>
                        <a href="/terminos-y-condiciones" className="hover:text-gray-600">{t('shell.terms')}</a>
                        <a href="/politica-de-cookies" className="hover:text-gray-600">{t('shell.cookies')}</a>
                    </nav>
                </div>
            </div>
        </div>
    )
}
