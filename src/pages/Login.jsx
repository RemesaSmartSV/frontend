import { useState } from 'react'
import { authApi } from '../services/api'

export default function Login({ onLogin, irRegistro }) {
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    async function iniciarSesion(e) {
        e.preventDefault()

        if (!correo || !contrasena) {
            setError('Completa todos los campos.')
            return
        }

        try {
            setCargando(true)
            setError('')

            const usuario = await authApi.login(correo, contrasena)

            onLogin(usuario)
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-slate-50 to-indigo-50 p-4 sm:p-8 font-sans">

            <section className="w-full max-w-[430px] rounded-[18px] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] sm:p-10">

                {/* Nombre de la aplicación */}
                <h1 className="text-center text-2xl font-extrabold tracking-tight text-blue-600 sm:text-[1.8rem]">
                    RemesaSmartSV
                </h1>

                {/* Título */}
                <h2 className="mt-7 mb-2 text-center text-2xl font-normal text-gray-800 sm:text-[1.5rem]">
                    Iniciar sesión
                </h2>

                {/* Descripción */}
                <p className="mb-7 leading-relaxed text-gray-500">
                    Ingresa a tu cuenta para administrar tus finanzas.
                </p>

                {/* Mensaje de error */}
                {error && (
                    <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">
                        {error}
                    </div>
                )}

                {/* Formulario */}
                <form
                    onSubmit={iniciarSesion}
                    className="flex flex-col gap-5"
                >

                    {/* Correo */}
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">
                            Correo
                        </label>

                        <input
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            className="w-full rounded-[9px] border border-gray-300 bg-white px-3.5 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Contraseña */}
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">
                            Contraseña
                        </label>

                        <input
                            type="password"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            placeholder="Contraseña"
                            className="w-full rounded-[9px] border border-gray-300 bg-white px-3.5 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Botón */}
                    <button
                        type="submit"
                        disabled={cargando}
                        className="mt-1 w-full rounded-[9px] bg-blue-600 px-3 py-3 text-base font-bold text-white transition hover:-translate-y-px hover:bg-blue-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                        {cargando
                            ? 'Iniciando sesión...'
                            : 'Iniciar sesión'}
                    </button>

                </form>

                {/* Registro */}
                <div className="mt-7 border-t border-gray-200 pt-6 text-center">

                    <p className="mb-3 text-sm text-gray-500">
                        ¿No tienes una cuenta?
                    </p>

                    <button
                        type="button"
                        onClick={irRegistro}
                        className="text-[0.95rem] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                        Crear cuenta
                    </button>

                </div>

            </section>

        </main>
    )
}