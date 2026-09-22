import { useState } from 'react'
import { authApi } from '../services/api'
import Notification from '../components/Notification'

export default function Register({ volverLogin }) {
    const [formulario, setFormulario] = useState({
        nombre: '',
        correo: '',
        contrasena: '',
        nombreFamiliar: '',
    })

    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    function manejarCambio(e) {
        const { name, value } = e.target

        setFormulario({
            ...formulario,
            [name]: value,
        })
    }

    async function registrar(e) {
        e.preventDefault()

        setMensaje('')
        setError('')

        if (
            !formulario.nombre.trim() ||
            !formulario.correo.trim() ||
            !formulario.contrasena.trim() ||
            !formulario.nombreFamiliar.trim()
        ) {
            setError('Completa todos los campos.')
            return
        }

        if (formulario.contrasena.length < 6) {
            setError(
                'La contraseña debe tener al menos 6 caracteres.'
            )
            return
        }

        try {
            setCargando(true)

            const datosRegistro = {
                nombre: formulario.nombre.trim(),
                correo: formulario.correo.trim(),
                contrasena: formulario.contrasena,
                nombreFamiliar: formulario.nombreFamiliar.trim(),
            }

            const respuesta =
                await authApi.register(datosRegistro)

            setMensaje(
                `Cuenta creada correctamente. Bienvenido, ${respuesta.nombre}`
            )

            setFormulario({
                nombre: '',
                correo: '',
                contrasena: '',
                nombreFamiliar: '',
            })
        } catch (err) {
            setError(
                err.message ||
                'No se pudo crear la cuenta. Inténtalo nuevamente.'
            )
        } finally {
            setCargando(false)
        }
    }

    return (
        <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-3 font-sans sm:p-6 lg:p-8">

            {/* NOTIFICACIÓN DE ÉXITO */}
            <Notification
                tipo="success"
                mensaje={mensaje}
                onClose={() => setMensaje('')}
            />

            {/* NOTIFICACIÓN DE ERROR */}
            <Notification
                tipo="error"
                mensaje={error}
                onClose={() => setError('')}
            />

            <section className="w-full max-w-[450px] overflow-hidden rounded-2xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.1)] sm:p-8 md:p-10">

                {/* ENCABEZADO */}
                <div className="mb-7 text-center sm:mb-8">

                    <h1 className="text-center text-2xl font-extrabold tracking-tight text-blue-600 sm:text-[1.8rem]">
                        RemesaSmartSV
                    </h1>

                    <h2 className="mb-2 text-2xl font-normal text-gray-900 sm:text-[1.6rem]">
                        Crear cuenta
                    </h2>

                    <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
                        Regístrate para comenzar a administrar
                        las finanzas de tu hogar.
                    </p>

                </div>

                {/* FORMULARIO */}
                <form
                    onSubmit={registrar}
                    className="flex min-w-0 flex-col"
                >

                    {/* NOMBRE */}
                    <div className="mb-4 flex min-w-0 flex-col gap-2 sm:mb-5">

                        <label
                            htmlFor="nombre"
                            className="text-sm font-semibold text-gray-700 sm:text-base"
                        >
                            Nombre
                        </label>

                        <input
                            id="nombre"
                            type="text"
                            name="nombre"
                            value={formulario.nombre}
                            onChange={manejarCambio}
                            placeholder="Ingresa tu nombre"
                            autoComplete="name"
                            required
                            disabled={cargando}
                            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                    </div>

                    {/* CORREO */}
                    <div className="mb-4 flex min-w-0 flex-col gap-2 sm:mb-5">

                        <label
                            htmlFor="correo"
                            className="text-sm font-semibold text-gray-700 sm:text-base"
                        >
                            Correo
                        </label>

                        <input
                            id="correo"
                            type="email"
                            name="correo"
                            value={formulario.correo}
                            onChange={manejarCambio}
                            placeholder="correo@ejemplo.com"
                            autoComplete="email"
                            required
                            disabled={cargando}
                            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                    </div>

                    {/* CONTRASEÑA */}
                    <div className="mb-4 flex min-w-0 flex-col gap-2 sm:mb-5">

                        <label
                            htmlFor="contrasena"
                            className="text-sm font-semibold text-gray-700 sm:text-base"
                        >
                            Contraseña
                        </label>

                        <input
                            id="contrasena"
                            type="password"
                            name="contrasena"
                            value={formulario.contrasena}
                            onChange={manejarCambio}
                            placeholder="Mínimo 6 caracteres"
                            autoComplete="new-password"
                            minLength={6}
                            required
                            disabled={cargando}
                            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                    </div>

                    {/* NOMBRE FAMILIAR */}
                    <div className="mb-4 flex min-w-0 flex-col gap-2 sm:mb-5">

                        <label
                            htmlFor="nombreFamiliar"
                            className="text-sm font-semibold text-gray-700 sm:text-base"
                        >
                            Nombre familiar
                        </label>

                        <input
                            id="nombreFamiliar"
                            type="text"
                            name="nombreFamiliar"
                            value={formulario.nombreFamiliar}
                            onChange={manejarCambio}
                            placeholder="Ej. Familia Duarte"
                            autoComplete="organization"
                            required
                            disabled={cargando}
                            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                    </div>

                    {/* BOTÓN */}
                    <button
                        type="submit"
                        disabled={cargando}
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-blue-300 disabled:active:scale-100"
                    >

                        {cargando && (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                        )}

                        {cargando
                            ? 'Registrando...'
                            : 'Crear cuenta'}

                    </button>

                </form>

                {/* VOLVER AL LOGIN */}
                <div className="mt-6 border-t border-gray-200 pt-5 text-center sm:mt-7 sm:pt-6">

                    <p className="mb-2.5 text-sm text-gray-500 sm:text-base">
                        ¿Ya tienes una cuenta?
                    </p>

                    <button
                        type="button"
                        onClick={volverLogin}
                        disabled={cargando}
                        className="bg-transparent text-base font-semibold text-blue-600 transition hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Iniciar sesión
                    </button>

                </div>

            </section>

        </main>
    )
}