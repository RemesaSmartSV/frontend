import { useEffect, useState } from 'react'
import { hogaresApi, invitacionesApi } from '../services/api'
import Notification from '../components/Notification'

// Paso obligatorio para cuentas recién registradas: el backend devuelve
// `idHogar: null` hasta que el usuario crea su hogar. App.jsx muestra esta
// pantalla en lugar del router mientras falte el hogar (único punto de
// decisión del gate).
// Si el usuario fue invitado a una familia, la invitación también se resuelve
// aquí: el gate no monta el router, así que la campana del Navbar no existe
// todavía. Aceptar completa el mismo camino: persistir LoginResponse y salir.
export default function HogarPendiente({ onHogarCreado }) {
    const [nombreFamiliar, setNombreFamiliar] = useState('')

    const [invitaciones, setInvitaciones] = useState([])
    const [respondiendo, setRespondiendo] = useState(null)
    const [errorInvitacion, setErrorInvitacion] = useState('')

    const [error, setError] = useState('')
    // Validación de campo: se muestra junto al input y se asocia con
    // aria-describedby/aria-invalid para lectores de pantalla.
    const [errorCampo, setErrorCampo] = useState('')
    const [cargando, setCargando] = useState(false)

    useEffect(() => {
        let vigente = true

        invitacionesApi
            .mias()
            .then((datos) => {
                if (vigente) setInvitaciones(datos || [])
            })
            .catch(() => {
                // Sin invitaciones o sin backend disponible: la pantalla
                // sigue ofreciendo la creación de familia.
            })

        return () => {
            vigente = false
        }
    }, [])

    async function responderInvitacion(id, accion) {
        setErrorInvitacion('')

        try {
            setRespondiendo(id)

            if (accion === 'aceptar') {
                const datosUsuario = await invitacionesApi.aceptar(id)

                localStorage.setItem('token', datosUsuario.token)
                localStorage.setItem('usuario', JSON.stringify(datosUsuario))
                onHogarCreado(datosUsuario)
            } else {
                await invitacionesApi.rechazar(id)
                setInvitaciones((prev) =>
                    prev.filter((inv) => Number(inv.idInvitacion) !== Number(id))
                )
            }
        } catch (err) {
            setErrorInvitacion(
                err.message || 'No se pudo responder la invitación.'
            )
        } finally {
            setRespondiendo(null)
        }
    }

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

                {/* INVITACIONES DE FAMILIA PENDIENTES */}
                {invitaciones.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-800">
                            Te invitaron a una familia
                        </h2>

                        <p className="mb-3 text-sm text-gray-500">
                            Puedes aceptar la invitación o crear tu propia familia.
                        </p>

                        {errorInvitacion && (
                            <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                                {errorInvitacion}
                            </p>
                        )}

                        <ul className="space-y-3">
                            {invitaciones.map((inv) => (
                                <li
                                    key={inv.idInvitacion}
                                    className="rounded-xl border border-blue-200 bg-blue-50 p-4"
                                >
                                    <p className="text-sm text-gray-700">
                                        Invitación enviada a tu correo.
                                    </p>

                                    <div className="mt-3 flex gap-2">
                                        <button
                                            type="button"
                                            disabled={respondiendo === inv.idInvitacion}
                                            onClick={() => responderInvitacion(inv.idInvitacion, 'aceptar')}
                                            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                                        >
                                            Aceptar
                                        </button>

                                        <button
                                            type="button"
                                            disabled={respondiendo === inv.idInvitacion}
                                            onClick={() => responderInvitacion(inv.idInvitacion, 'rechazar')}
                                            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Rechazar
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="my-6 border-t border-gray-200" />
                    </div>
                )}

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
