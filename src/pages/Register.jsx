import { useState } from 'react'
import { authApi } from '../services/api'

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
        setCargando(true)

        try {
            const respuesta = await authApi.register(formulario)

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
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4 font-sans sm:p-8">

            <section className="w-full max-w-[450px] rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] sm:p-10">

                {/* Encabezado */}
                <div className="mb-8 text-center">

                    <h1 className="mb-6 text-3xl font-normal text-blue-600 sm:text-[2rem]">
                        RemesaSmartSV
                    </h1>

                    <h2 className="mb-2 text-[1.6rem] font-normal text-gray-900">
                        Crear cuenta
                    </h2>

                    <p className="leading-relaxed text-gray-500">
                        Regístrate para comenzar a administrar
                        las finanzas de tu hogar.
                    </p>

                </div>

                {/* Mensaje de éxito */}
                {mensaje && (
                    <div className="mb-5 rounded-lg bg-green-100 p-3 text-[0.95rem] text-green-800">
                        {mensaje}
                    </div>
                )}

                {/* Mensaje de error */}
                {error && (
                    <div className="mb-5 rounded-lg bg-red-100 p-3 text-[0.95rem] text-red-800">
                        {error}
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={registrar}>

                    {/* Nombre */}
                    <div className="mb-5 flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">
                            Nombre
                        </label>

                        <input
                            type="text"
                            name="nombre"
                            value={formulario.nombre}
                            onChange={manejarCambio}
                            placeholder="Ingresa tu nombre"
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Correo */}
                    <div className="mb-5 flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">
                            Correo
                        </label>

                        <input
                            type="email"
                            name="correo"
                            value={formulario.correo}
                            onChange={manejarCambio}
                            placeholder="correo@ejemplo.com"
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Contraseña */}
                    <div className="mb-5 flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">
                            Contraseña
                        </label>

                        <input
                            type="password"
                            name="contrasena"
                            value={formulario.contrasena}
                            onChange={manejarCambio}
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Nombre familiar */}
                    <div className="mb-5 flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">
                            Nombre familiar
                        </label>

                        <input
                            type="text"
                            name="nombreFamiliar"
                            value={formulario.nombreFamiliar}
                            onChange={manejarCambio}
                            placeholder="Ej. Familia Duarte"
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Botón */}
                    <button
                        type="submit"
                        disabled={cargando}
                        className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                        {cargando
                            ? 'Registrando...'
                            : 'Crear cuenta'}
                    </button>

                </form>

                {/* Volver al Login */}
                <div className="mt-7 border-t border-gray-200 pt-6 text-center">

                    <p className="mb-2.5 text-gray-500">
                        ¿Ya tienes una cuenta?
                    </p>

                    <button
                        type="button"
                        onClick={volverLogin}
                        className="bg-transparent text-base font-semibold text-blue-600 hover:underline"
                    >
                        Iniciar sesión
                    </button>

                </div>

            </section>

        </main>
    )
}