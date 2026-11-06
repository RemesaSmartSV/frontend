import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    ArrowRight,
    ArrowLeftRight,
    PiggyBank,
    Users,
    LineChart
} from 'lucide-react'
import { authApi } from '../services/api'
import Notification from '../components/Notification'
import GoogleSignInButton from '../components/GoogleSignInButton'
import LanguageSelector from '../components/LanguageSelector'
import logoBlanco from '../assets/logo-blanco-trimmed.png'

export default function Login({ onLogin, irRegistro }) {
    const { t } = useTranslation()
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [verContrasena, setVerContrasena] = useState(false)
    const [error, setError] = useState('')
    const [errorCampo, setErrorCampo] = useState('')
    const [cargando, setCargando] = useState(false)
    // Flujo de restablecimiento: se muestra/oculta como formulario inline en
    // la misma pantalla, sin window.prompt ni window.alert.
    const [mostrandoReset, setMostrandoReset] = useState(false)
    const [correoReset, setCorreoReset] = useState('')
    const [mensajeReset, setMensajeReset] = useState('')

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

    function abrirReset() {
        setMostrandoReset(true)
        setError('')
        setErrorCampo('')
        setMensajeReset('')
        setCorreoReset('')
    }

    function volverAlLogin() {
        setMostrandoReset(false)
        setError('')
        setErrorCampo('')
        setMensajeReset('')
        setCorreoReset('')
    }

    async function solicitarReset(e) {
        e.preventDefault()
        setError('')
        setErrorCampo('')
        setMensajeReset('')

        if (!correoReset.trim()) {
            setErrorCampo(t('auth.completeFields'))
            return
        }
        if (!correoReset.trim().toLowerCase().endsWith('@gmail.com')) {
            setError(t('auth.gmailOnly'))
            return
        }

        setCargando(true)
        try {
            const datos = await authApi.solicitarReset(correoReset.trim())
            // Éxito: el backend siempre responde 200 con mensaje genérico.
            setMensajeReset(datos?.message || t('auth.resetSent'))
            setCorreoReset('')
        } catch (err) {
            setError(err.message || t('auth.resetError'))
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="login-fondo flex min-h-screen items-center justify-center px-4 py-10">
            {/* Estructura centrada a todo el ancho: se elimina la división
                50/50 (panel de marca + formulario) que dejaba ~250px de
                gradiente muerto a cada lado de la tarjeta en desktop. Logo,
                beneficios y copyright conviven en una sola columna. */}
            <div className="w-full max-w-xl">
                <div className="mb-4 flex justify-end">
                    <LanguageSelector />
                </div>
                {/* Logo de marca en todos los breakpoints (reemplaza al panel
                    izquierdo eliminado): chip navy con el asset trimmed, la
                    misma variante que antes solo se veía en móvil. */}
                <div className="mb-6 flex flex-col items-center text-center">
                    <span className="inline-flex rounded-2xl bg-[#123B8F] px-5 py-3.5">
                        <img src={logoBlanco} alt="RemesaSmart SV" className="h-8 w-auto" />
                    </span>
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t('auth.tagline')}</p>
                </div>

                {/* Tarjeta elevada: ancla visual del formulario. En dark el
                    shadow-xl no se ve sobre negro, así que el borde #2a2a2a
                    define la tarjeta. */}
                <div className="rounded-2xl bg-white p-8 shadow-xl dark:border dark:border-[#2a2a2a]">

                    {error && <Notification tipo="error" mensaje={error} onClose={() => setError('')} />}
                    {mensajeReset && (
                        <Notification
                            tipo="success"
                            mensaje={mensajeReset}
                            onClose={() => setMensajeReset('')}
                        />
                    )}

                    {mostrandoReset ? (
                        <>
                            <h2 id="reset-titulo" className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {t('auth.resetTitle')}
                            </h2>
                            <p className="mb-8 text-gray-500 dark:text-gray-400">
                                {t('auth.resetSubtitle')}
                            </p>

                            {/* FORMULARIO INLINE DE RESTABLECIMIENTO */}
                            <form onSubmit={solicitarReset} className="space-y-5">
                                <div>
                                    <label htmlFor="correo-reset" className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {t('auth.email')}
                                    </label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            id="correo-reset"
                                            type="email"
                                            value={correoReset}
                                            onChange={(e) => { setCorreoReset(e.target.value); setErrorCampo('') }}
                                            placeholder={t('auth.emailExampleGmail')}
                                            autoComplete="email"
                                            required
                                            disabled={cargando}
                                            aria-invalid={errorCampo ? 'true' : undefined}
                                            aria-describedby={errorCampo ? 'login-error-campo' : 'correo-ayuda'}
                                            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
                                        />
                                    </div>
                                    {/* La política @gmail.com se avisa siempre, no como error tardío. */}
                                    <p id="correo-ayuda" className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        {t('auth.gmailHint')}
                                    </p>
                                </div>

                                {errorCampo && (
                                    <p id="login-error-campo" role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                                        {errorCampo}
                                    </p>
                                )}

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="submit"
                                        disabled={cargando}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-base font-bold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {cargando && (
                                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        )}
                                        {cargando ? t('common.enviando') : t('auth.resetSend')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={volverAlLogin}
                                        disabled={cargando}
                                        className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
                                    >
                                        {t('common.volver')}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-100">{t('auth.login')}</h2>
                            <p className="mb-8 text-gray-500 dark:text-gray-400">{t('auth.loginSubtitle')}</p>

                            <form onSubmit={iniciarSesion} className="space-y-5">
                        {/* Correo */}
                        <div>
                            <label htmlFor="correo" className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t('auth.email')}
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="correo"
                                    type="email"
                                    value={correo}
                                    onChange={(e) => { setCorreo(e.target.value); setErrorCampo('') }}
                                    placeholder={t('auth.emailExampleGmail')}
                                    autoComplete="email"
                                    required
                                    disabled={cargando}
                                    aria-invalid={errorCampo ? 'true' : undefined}
                                    aria-describedby={errorCampo ? 'login-error-campo' : 'correo-ayuda'}
                                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
                                />
                            </div>
                            {/* La política @gmail.com se avisa siempre, no como error tardío. */}
                            <p id="correo-ayuda" className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                {t('auth.gmailHint')}
                            </p>
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label htmlFor="contrasena" className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t('auth.password')}
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
                                onClick={abrirReset}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                                {t('auth.forgot')}
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
                            {cargando ? t('common.cargando') : t('auth.signIn')}
                        </button>
                    </form>

                    {/* Separador */}
                    <div className="my-6 flex items-center">
                        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                        <span className="px-3 text-sm text-gray-500">{t('auth.or')}</span>
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
                        {t('auth.noAccount')}{' '}
                        <button
                            type="button"
                            onClick={irRegistro}
                            disabled={cargando}
                            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                            {t('auth.register')}
                        </button>
                    </p>
                        </>
                    )}

                    {/* Enlace presentación */}
                    <p className="mt-4 text-center">
                        <a href="/presentacion" className="text-xs text-gray-500 hover:text-gray-600">
                            {t('auth.learnMore')}
                        </a>
                    </p>

                    {/* Enlaces legales */}
                    <nav aria-label={t('shell.legalLinks')} className="mt-6 flex justify-center gap-x-4 text-xs text-gray-500">
                        <a href="/politica-de-privacidad" className="hover:text-gray-600">{t('shell.privacy')}</a>
                        <a href="/terminos-y-condiciones" className="hover:text-gray-600">{t('shell.terms')}</a>
                        <a href="/politica-de-cookies" className="hover:text-gray-600">{t('shell.cookies')}</a>
                    </nav>
                </div>

                {/* Beneficios: tira compacta bajo la tarjeta (movida desde
                    el panel izquierdo eliminado). */}
                <div className="mt-8 hidden sm:grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                        { Icono: ArrowLeftRight, texto: t('auth.benefitTransactions') },
                        { Icono: PiggyBank, texto: t('auth.benefitSavings') },
                        { Icono: Users, texto: t('auth.benefitFamily') },
                        { Icono: LineChart, texto: t('auth.benefitCharts') },
                    ].map(({ Icono, texto }, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 text-center">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-white/10">
                                <Icono size={18} strokeWidth={1.8} />
                            </span>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{texto}</p>
                        </div>
                    ))}
                </div>

                {/* Copyright centrado debajo de los beneficios */}
                <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">{t('auth.copyright')}</p>
            </div>
        </div>
    )
}
