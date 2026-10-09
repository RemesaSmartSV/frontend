import { useState } from 'react'
import { hogaresApi } from '../services/api'
import Notification from '../components/Notification'

// Paso obligatorio para cuentas recién registradas: el backend devuelve
// `idHogar: null` hasta que el usuario crea su hogar. App.jsx muestra esta
// pantalla en lugar del router mientras falte el hogar (único punto de
// decisión del gate).
export default function HogarPendiente({ onHogarCreado }) {
    const [nombreFamiliar, setNombreFamiliar] = useState('')

    const [error, setError] = useState('')
    // Validación de campo: se muestra junto al input y se asocia con
    // aria-describedby/aria-invalid para lectores de pantalla.
    const [errorCampo, setErrorCampo] = useState('')
    const [cargando, setCargando] = useState(false)

    const ariaError = errorCampo
        ? {
              'aria-invalid': 'true',
              'aria-describedby': 'hogar-error-campo',
          }
        : {}

    async function crearHogar(e) {
        e.preventDefault()

        setError('')

        if (!nombreFamiliar.trim()) {
            setErrorCampo('Completa el nombre de tu familia.')
            return
        }

        setErrorCampo('')

        try {
            setCargando(true)

            // El backend responde un LoginResponse refrescado: token nuevo,
            // rol e idHogar con valor. Se persiste con las mismas claves que
            // usa authApi.login y App deja entrar a la app al actualizar el
            // estado de sesión.
            const datosUsuario = await hogaresApi.crear(
                nombreFamiliar.trim()
            )

            localStorage.setItem('token', datosUsuario.token)
            localStorage.setItem('usuario', JSON.stringify(datosUsuario))

            onHogarCreado(datosUsuario)
        } catch (err) {
            // Incluye el 409 del backend ("Ya pertenecés a un hogar."):
            // manejarRespuesta propaga el message tal cual.
            setError(
                err.message ||
                'No se pudo crear tu familia. Inténtalo nuevamente.'
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
                    Creá tu familia
                </h2>

                {/* DESCRIPCIÓN */}
                <p className="mb-6 text-center text-sm leading-relaxed text-gray-500 sm:mb-7 sm:text-base">
                    Para empezar a administrar las finanzas de tu hogar,
                    crea primero tu familia.
                </p>

                {/* FORMULARIO */}
                <form
                    onSubmit={crearHogar}
                    className="flex flex-col gap-4 sm:gap-5"
                >

                    {/* NOMBRE FAMILIAR */}
                    <div className="flex min-w-0 flex-col gap-2">

                        <label
                            htmlFor="nombreFamiliar"
                            className="text-sm font-semibold text-gray-700 sm:text-base"
                        >
                            Nombre familiar
                        </label>

                        <input
                            id="nombreFamiliar"
                            type="text"
                            value={nombreFamiliar}
                            onChange={(e) => {
                                setNombreFamiliar(e.target.value)
                                setErrorCampo('')
                            }}
                            placeholder="Ej. Familia Duarte"
                            autoComplete="organization"
                            required
                            disabled={cargando}
                            {...ariaError}
                            className="w-full min-w-0 rounded-[9px] border border-gray-300 bg-white px-3.5 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                    </div>

                    {/* ERROR DE VALIDACIÓN ASOCIADO AL CAMPO */}
                    {errorCampo && (
                        <p
                            id="hogar-error-campo"
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
                            ? 'Creando tu familia...'
                            : 'Crear familia'}
                    </button>

                </form>

            </section>

        </main>
    )
}
