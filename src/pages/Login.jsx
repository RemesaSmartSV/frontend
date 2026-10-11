import { useState } from 'react'
import { authApi } from '../services/api'
import Notification from '../components/Notification'

export default function Login({ onLogin, irRegistro }) {
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')

    const [error, setError] = useState('')
    // Error de validación del propio campo: se muestra junto a los inputs y se
    // asocia con aria-describedby/aria-invalid para lectores de pantalla.
    const [errorCampo, setErrorCampo] = useState('')
    const [cargando, setCargando] = useState(false)

    // Mientras haya error de validación, los inputs quedan marcados como
    // inválidos y describidos por el mensaje que se muestra debajo.
    const ariaError = errorCampo
        ? {
              'aria-invalid': 'true',
              'aria-describedby': 'login-error-campo',
          }
        : {}

    async function iniciarSesion(e) {
        e.preventDefault()

        if (!correo.trim() || !contrasena.trim()) {
            setErrorCampo('Completa todos los campos.')
            return
        }

        setErrorCampo('')

        try {
            setCargando(true)
            setError('')

            const usuario = await authApi.login(
                correo.trim(),
                contrasena
            )

            onLogin(usuario)
        } catch (err) {
            setError(
                err.message ||
                'No se pudo iniciar sesión. Verifica tus datos.'
            )
        } finally {
            setCargando(false)
        }
    }

    return (
        <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-3 font-sans sm:p-6 lg:p-8">

            {/* NOTIFICACIÓN DE ERROR */}
            <Notification
                tipo="error"
                mensaje={error}
                onClose={() => setError('')}
            />

            <section className="w-full max-w-[430px] overflow-hidden rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] sm:p-8 md:p-10">

                {/* NOMBRE DE LA APLICACIÓN */}
                <h1 className="text-center text-2xl font-extrabold tracking-tight text-blue-600 sm:text-[1.8rem]">
                    RemesaSmartSV
                </h1>

                {/* TÍTULO */}
                <h2 className="mb-2 mt-6 text-center text-2xl font-normal text-gray-800 sm:mt-7 sm:text-[1.5rem]">
                    Iniciar sesión
                </h2>

                {/* DESCRIPCIÓN */}
                <p className="mb-6 text-center text-sm leading-relaxed text-gray-500 sm:mb-7 sm:text-base">
                    Ingresa a tu cuenta para administrar tus finanzas.
                </p>

                {/* FORMULARIO */}
                <form
                    onSubmit={iniciarSesion}
                    className="flex flex-col gap-4 sm:gap-5"
                >

                    {/* CORREO */}
                    <div className="flex min-w-0 flex-col gap-2">

                        <label
                            htmlFor="correo"
                            className="text-sm font-semibold text-gray-700 sm:text-base"
                        >
                            Correo
                        </label>

                        <input
                            id="correo"
                            type="email"
                            value={correo}
                            onChange={(e) => {
                                setCorreo(e.target.value)
                                setErrorCampo('')
                            }}
                            placeholder="correo@ejemplo.com"
                            autoComplete="email"
                            required
                            disabled={cargando}
                            {...ariaError}
                            className="w-full min-w-0 rounded-[9px] border border-gray-300 bg-white px-3.5 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                    </div>

                    {/* CONTRASEÑA */}
                    <div className="flex min-w-0 flex-col gap-2">

                        <label
                            htmlFor="contrasena"
                            className="text-sm font-semibold text-gray-700 sm:text-base"
                        >
                            Contraseña
                        </label>

                        <input
                            id="contrasena"
                            type="password"
                            value={contrasena}
                            onChange={(e) => {
                                setContrasena(e.target.value)
                                setErrorCampo('')
                            }}
                            placeholder="Contraseña"
                            autoComplete="current-password"
                            required
                            disabled={cargando}
                            {...ariaError}
                            className="w-full min-w-0 rounded-[9px] border border-gray-300 bg-white px-3.5 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                    </div>

                    {/* ¿Olvidaste tu contraseña? */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                const correo = window.prompt('Ingresa tu correo electrónico para restablecer tu contraseña:')
                                if (correo) {
                                    fetch('/api/Auth/solicitar-reset', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ correo }),
                                    })
                                        .then(() => window.alert('Si el correo existe, recibirás un enlace para restablecer tu contraseña.'))
                                        .catch(() => window.alert('No se pudo procesar la solicitud. Inténtalo de nuevo.'))
                                }
                            }}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>

                    {/* ERROR DE VALIDACIÓN ASOCIADO A LOS CAMPOS */}
                    {errorCampo && (
                        <p
                            id="login-error-campo"
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                        >
                            {errorCampo}
                        </p>
                    )}

                    {/* BOTÓN */}
                    <button
                        type="submit"
                        disabled={cargando}
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-[9px] bg-blue-600 px-3 py-3 text-base font-bold text-white transition hover:-translate-y-px hover:bg-blue-700 active:scale-[0.99] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                        {cargando && (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                        )}

                        {cargando
                            ? 'Iniciando sesión...'
                            : 'Iniciar sesión'}
                    </button>

                </form>

                {/* GOOGLE SIGN-IN */}
                <div className="mt-4">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-400">o</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            // Google Identity Services: el script se carga desde accounts.google.com
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
                                            }
                                        } catch {
                                            window.alert('No se pudo iniciar sesión con Google.')
                                        }
                                    },
                                })
                                window.google.accounts.id.prompt()
                            } else {
                                window.alert('Google Sign-In no está disponible. Configura GOOGLE_CLIENT_ID.')
                            }
                        }}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[9px] border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Continuar con Google
                    </button>
                </div>

                {/* REGISTRO */}
                <div className="mt-6 border-t border-gray-200 pt-5 text-center sm:mt-7 sm:pt-6">

                    <p className="mb-3 text-sm text-gray-500">
                        ¿No tienes una cuenta?
                    </p>

                    <button
                        type="button"
                        onClick={irRegistro}
                        disabled={cargando}
                        className="text-[0.95rem] font-bold text-blue-600 transition hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Crear cuenta
                    </button>

                </div>

                {/* PRESENTACIÓN COMERCIAL */}
                <div className="mt-5 text-center">

                    <a
                        href="/presentacion"
                        className="text-xs font-medium text-slate-400 transition hover:text-blue-600 hover:underline"
                    >
                        Ver presentación del producto
                    </a>

                </div>

                {/* ENLACES LEGALES (accesibles sin sesión) */}
                <nav
                    aria-label="Enlaces legales"
                    className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs"
                >
                    <a
                        href="/politica-de-privacidad"
                        className="text-slate-400 transition hover:text-blue-600 hover:underline"
                    >
                        Privacidad
                    </a>
                    <a
                        href="/terminos-y-condiciones"
                        className="text-slate-400 transition hover:text-blue-600 hover:underline"
                    >
                        Términos y condiciones
                    </a>
                    <a
                        href="/politica-de-cookies"
                        className="text-slate-400 transition hover:text-blue-600 hover:underline"
                    >
                        Política de cookies
                    </a>
                </nav>

            </section>

        </main>
    )
}