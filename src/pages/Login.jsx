import { useState } from 'react'
import { authApi } from '../services/api'
import Notification from '../components/Notification'

export default function Login({ onLogin, irRegistro }) {
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')

    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    async function iniciarSesion(e) {
        e.preventDefault()

        if (!correo.trim() || !contrasena.trim()) {
            setError('Completa todos los campos.')
            return
        }

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
                            onChange={(e) =>
                                setCorreo(e.target.value)
                            }
                            placeholder="correo@ejemplo.com"
                            autoComplete="email"
                            disabled={cargando}
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
                            onChange={(e) =>
                                setContrasena(e.target.value)
                            }
                            placeholder="Contraseña"
                            autoComplete="current-password"
                            disabled={cargando}
                            className="w-full min-w-0 rounded-[9px] border border-gray-300 bg-white px-3.5 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                    </div>

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

            </section>

        </main>
    )
}