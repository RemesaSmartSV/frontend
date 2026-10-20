import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    authApi,
    hogaresApi,
    invitacionesApi,
    solicitudesUnionApi,
    usuariosApi,
} from '../services/api'
import { formatearFecha } from '../utils/formato'
import Notification from '../components/Notification'
import LanguageSelector from '../components/LanguageSelector'

// Formato del código público generado por el backend (CodigoHogar):
// ID de 6 dígitos numéricos. También se acepta el formato legacy
// "RS-FAM-" + 16 caracteres para hogares ya emitidos. La validación
// es solo UX; el backend vuelve a validar y normaliza (mayúsculas,
// sin espacios).
const CODIGO_FAMILIA_REGEX = /^(\d{6}|RS-FAM-[A-Z0-9]{16})$/

// Pantalla de creación/búsqueda de familia. Vive en la ruta /hogar cuando la
// cuenta no tiene hogar (App.jsx ya no la usa como muro: el router se monta
// igual y el resto de la app queda navegable). Por eso mismo ofrece salir del
// flujo y seguir usando la app sin familia.
// Si el usuario fue invitado a una familia, la invitación también se resuelve
// aquí: aceptar persiste el LoginResponse y actualiza la sesión de App, que
// vuelve a evaluar esta misma ruta y muestra MiHogar.
export default function HogarPendiente({ onHogarCreado }) {
    const { t } = useTranslation()
    const [nombreFamiliar, setNombreFamiliar] = useState('')

    const [invitaciones, setInvitaciones] = useState([])
    const [respondiendo, setRespondiendo] = useState(null)
    const [errorInvitacion, setErrorInvitacion] = useState('')

    // Búsqueda por código público y solicitudes de unión propias.
    const [codigo, setCodigo] = useState('')
    const [familiaEncontrada, setFamiliaEncontrada] = useState(null)
    const [solicitudes, setSolicitudes] = useState([])
    const [buscando, setBuscando] = useState(false)
    const [solicitando, setSolicitando] = useState(false)
    const [cancelando, setCancelando] = useState(null)
    const [actualizandoSesion, setActualizandoSesion] = useState(false)
    const [errorBusqueda, setErrorBusqueda] = useState('')
    const [errorSolicitud, setErrorSolicitud] = useState('')
    const [mensaje, setMensaje] = useState('')

    // Búsqueda por nombre: el backend devuelve { idHogar, nombreFamiliar }
    // y nunca el código público, así que la solicitud se arma con idHogar.
    const [nombreBusqueda, setNombreBusqueda] = useState('')
    const [coincidencias, setCoincidencias] = useState([])
    const [busquedaHecha, setBusquedaHecha] = useState(false)
    const [buscandoPorNombre, setBuscandoPorNombre] = useState(false)
    const [solicitandoAHogar, setSolicitandoAHogar] = useState(null)
    const [errorBusquedaNombre, setErrorBusquedaNombre] = useState('')

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

        solicitudesUnionApi
            .mias()
            .then((datos) => {
                if (vigente) setSolicitudes(datos || [])
            })
            .catch(() => {
                // Sin solicitudes o sin backend disponible: la pantalla
                // sigue usable con la creación y la búsqueda por código.
            })

        return () => {
            vigente = false
        }
    }, [])

    async function recargarSolicitudes() {
        try {
            const datos = await solicitudesUnionApi.mias()
            setSolicitudes(datos || [])
        } catch {
            // La lista se queda con el último estado conocido.
        }
    }

    async function buscarFamilia(e) {
        e.preventDefault()

        setError('')
        setMensaje('')
        setErrorBusqueda('')
        setFamiliaEncontrada(null)

        const codigoNormalizado = codigo
            .trim()
            .replace(/\s+/g, '')
            .toUpperCase()

        if (!codigoNormalizado) {
            setErrorBusqueda(t('pendingHome.codeRequired'))
            return
        }

        if (!CODIGO_FAMILIA_REGEX.test(codigoNormalizado)) {
            setErrorBusqueda(t('pendingHome.codeInvalid'))
            return
        }

        try {
            setBuscando(true)

            const datos = await usuariosApi.buscarPorCodigo(codigoNormalizado)
            setFamiliaEncontrada(datos)
        } catch (err) {
            // Incluye el 404 del backend ("No se encontró una familia...").
            setErrorBusqueda(
                err.message || t('pendingHome.searchError')
            )
        } finally {
            setBuscando(false)
        }
    }

    async function solicitarUnion() {
        if (!familiaEncontrada) return

        setError('')
        setMensaje('')
        setErrorSolicitud('')

        try {
            setSolicitando(true)

            await solicitudesUnionApi.crear({
                codigoPublico: familiaEncontrada.codigoPublico,
            })

            setMensaje(t('pendingHome.joinSuccess'))
            setCodigo('')
            setFamiliaEncontrada(null)
            await recargarSolicitudes()
        } catch (err) {
            // Incluye los 409 del backend (ya pertenece, solicitud
            // pendiente, o familia sin admin): manejarRespuesta propaga
            // el message tal cual.
            setErrorSolicitud(
                err.message || t('pendingHome.joinError')
            )
        } finally {
            setSolicitando(false)
        }
    }

    // GET /Hogares/buscar-por-nombre: mínimo 3 caracteres (el backend
    // responde 400 si no, así que se valida antes de llamar). Sin
    // coincidencias el endpoint devuelve lista vacía, no 404.
    async function buscarFamiliaPorNombre(e) {
        e.preventDefault()

        setError('')
        setMensaje('')
        setErrorBusquedaNombre('')
        setCoincidencias([])
        setBusquedaHecha(false)

        const texto = nombreBusqueda.trim()

        if (texto.length < 3) {
            setErrorBusquedaNombre(t('family.searchByNameMin'))
            return
        }

        try {
            setBuscandoPorNombre(true)

            const datos = await hogaresApi.buscarPorNombre(texto)
            setCoincidencias(Array.isArray(datos) ? datos : [])
            setBusquedaHecha(true)
        } catch (err) {
            // 400 (texto corto) o límite de tasa: manejarRespuesta propaga
            // el message tal cual y se muestra con el patrón general de error.
            setError(err.message || t('family.searchByNameError'))
        } finally {
            setBuscandoPorNombre(false)
        }
    }

    // La búsqueda por nombre no trae el código público (privacidad): la
    // solicitud se envía con { idHogar } y queda pendiente de aprobación.
    async function solicitarUnionPorNombre(familia) {
        setError('')
        setMensaje('')

        try {
            setSolicitandoAHogar(familia.idHogar)

            await solicitudesUnionApi.crear({ idHogar: familia.idHogar })

            setMensaje(t('pendingHome.joinSuccess'))
            setCoincidencias((prev) =>
                prev.filter((item) => item.idHogar !== familia.idHogar)
            )
            await recargarSolicitudes()
        } catch (err) {
            // Incluye los 409/404 del backend: manejarRespuesta propaga
            // el message tal cual.
            setError(err.message || t('pendingHome.joinError'))
        } finally {
            setSolicitandoAHogar(null)
        }
    }

    async function cancelarSolicitud(id) {
        setError('')
        setMensaje('')
        setErrorSolicitud('')

        try {
            setCancelando(id)

            await solicitudesUnionApi.cancelar(id)

            setMensaje(t('pendingHome.cancelSuccess'))
            await recargarSolicitudes()
        } catch (err) {
            setErrorSolicitud(
                err.message || t('pendingHome.cancelError')
            )
        } finally {
            setCancelando(null)
        }
    }

    // Un solicitante cuya solicitud fue aceptada sigue sin idHogar en el
    // token viejo: refrescar-sesion devuelve un LoginResponse nuevo (con
    // idHogar y rol Miembro). authApi.refrescarSesion ya persiste token y
    // usuario; onHogarCreado actualiza el estado de sesión en App, que al
    // ver el idHogar monta MiHogar en esta misma ruta (mismo camino que
    // aceptar una invitación).
    async function actualizarSesion() {
        setError('')
        setErrorSolicitud('')

        try {
            setActualizandoSesion(true)

            const datosUsuario = await authApi.refrescarSesion()
            onHogarCreado(datosUsuario)
        } catch (err) {
            setErrorSolicitud(
                err.message || t('pendingHome.refreshError')
            )
        } finally {
            setActualizandoSesion(false)
        }
    }

    const solicitudesAceptadas = solicitudes.filter(
        (sol) => sol.estado === 'Aceptada'
    )

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
                err.message || t('pendingHome.invitationError')
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
            setErrorCampo(t('pendingHome.nameRequired'))
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
                t('pendingHome.createError')
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

            {/* NOTIFICACIÓN DE ÉXITO */}
            <Notification
                tipo="success"
                mensaje={mensaje}
                onClose={() => setMensaje('')}
            />

            <section className="w-full max-w-[430px] overflow-hidden rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] sm:p-8 md:p-10">
                <div className="mb-4 flex justify-end"><LanguageSelector /></div>

                {/* SOLICITUD ACEPTADA: ACTUALIZAR SESIÓN */}
                {solicitudesAceptadas.length > 0 && (
                    <div
                        role="status"
                        className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4"
                    >
                        <p className="text-sm font-semibold text-green-800">
                            {t('pendingHome.acceptedNotice')}
                        </p>

                        <button
                            type="button"
                            disabled={actualizandoSesion}
                            onClick={actualizarSesion}
                            className="mt-3 w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            {actualizandoSesion
                                ? t('pendingHome.refreshingSession')
                                : t('pendingHome.refreshSession')}
                        </button>
                    </div>
                )}

                {/* INVITACIONES DE FAMILIA PENDIENTES */}
                {invitaciones.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-800">
                            {t('pendingHome.invited')}
                        </h2>

                        <p className="mb-3 text-sm text-gray-500">
                            {t('pendingHome.invitationHint')}
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
                                        {t('pendingHome.sentToEmail')}
                                    </p>

                                    <div className="mt-3 flex gap-2">
                                        <button
                                            type="button"
                                            disabled={respondiendo === inv.idInvitacion}
                                            onClick={() => responderInvitacion(inv.idInvitacion, 'aceptar')}
                                            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {t('common.aceptar')}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={respondiendo === inv.idInvitacion}
                                            onClick={() => responderInvitacion(inv.idInvitacion, 'rechazar')}
                                            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            {t('common.rechazar')}
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
                    RemesaSmart SV
                </h1>

                {/* TÍTULO */}
                <h2 className="mb-2 mt-6 text-center text-2xl font-normal text-gray-800 sm:mt-7 sm:text-[1.5rem]">
                    {t('pendingHome.createTitle')}
                </h2>

                {/* DESCRIPCIÓN */}
                <p className="mb-6 text-center text-sm leading-relaxed text-gray-500 sm:mb-7 sm:text-base">
                    {t('pendingHome.createDescription')}
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
                            {t('pendingHome.name')}
                        </label>

                        <input
                            id="nombreFamiliar"
                            type="text"
                            value={nombreFamiliar}
                            onChange={(e) => {
                                setNombreFamiliar(e.target.value)
                                setErrorCampo('')
                            }}
                            placeholder={t('pendingHome.namePlaceholder')}
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
                            ? t('pendingHome.creating')
                            : t('pendingHome.create')}
                    </button>

                </form>

                {/* SALIR DEL FLUJO: la app no exige tener familia. Es solo
                    navegación (href): App no bloquea el router, así que el
                    destino carga la app completa sin familia. */}
                <a
                    href="/"
                    className="mt-4 flex w-full items-center justify-center rounded-[9px] border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                    {t('family.skipForNow')}
                </a>

                <p className="mt-2 text-center text-xs leading-relaxed text-gray-500">
                    {t('family.skipHint')}
                </p>

                <div className="my-6 border-t border-gray-200" />

                {/* ÚNETE A UNA FAMILIA CON CÓDIGO PÚBLICO */}
                <h2 className="mb-2 text-lg font-bold text-gray-800">
                    {t('pendingHome.joinTitle')}
                </h2>

                <p className="mb-4 text-sm leading-relaxed text-gray-500">
                    {t('pendingHome.joinDescription')}
                </p>

                <form
                    onSubmit={buscarFamilia}
                    className="flex flex-col gap-3 sm:flex-row"
                >
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <label
                            htmlFor="codigoFamilia"
                            className="text-sm font-semibold text-gray-700"
                        >
                            {t('pendingHome.codeLabel')}
                        </label>

                        <input
                            id="codigoFamilia"
                            type="text"
                            value={codigo}
                            onChange={(e) => {
                                setCodigo(e.target.value)
                                setErrorBusqueda('')
                            }}
                            placeholder={t('pendingHome.codePlaceholder')}
                            autoComplete="off"
                            spellCheck="false"
                            disabled={buscando || solicitando}
                            aria-invalid={errorBusqueda ? 'true' : undefined}
                            className="w-full min-w-0 rounded-[9px] border border-gray-300 bg-white px-3.5 py-3 font-mono text-base uppercase outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:font-mono placeholder:normal-case placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={buscando || solicitando}
                        className="mt-1 flex shrink-0 items-center justify-center gap-2 self-end rounded-[9px] bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-px hover:bg-blue-700 active:scale-[0.99] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                        {buscando && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                        )}

                        {buscando
                            ? t('common.buscando')
                            : t('pendingHome.search')}
                    </button>
                </form>

                {errorBusqueda && (
                    <p
                        role="alert"
                        className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                    >
                        {errorBusqueda}
                    </p>
                )}

                {/* FAMILIA ENCONTRADA */}
                {familiaEncontrada && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <p className="text-sm text-gray-700">
                            {t('pendingHome.familyFound')}
                        </p>

                        <p className="mt-1 text-base font-bold text-gray-800">
                            {familiaEncontrada.nombreFamiliar}
                        </p>

                        <button
                            type="button"
                            disabled={solicitando}
                            onClick={solicitarUnion}
                            className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {solicitando
                                ? t('pendingHome.joinSending')
                                : t('pendingHome.joinRequest')}
                        </button>
                    </div>
                )}

                {/* BÚSQUEDA POR NOMBRE: alternativa a tener el código. Solo
                    permite SOLICITAR unión (el endpoint no devuelve el código
                    público) y el Admin de la familia la aprueba o rechaza. */}
                <div className="my-6 border-t border-gray-200" />

                <h2 className="mb-2 text-lg font-bold text-gray-800">
                    {t('family.searchByNameTitle')}
                </h2>

                <p className="mb-4 text-sm leading-relaxed text-gray-500">
                    {t('family.searchByNameHint')}
                </p>

                <form
                    onSubmit={buscarFamiliaPorNombre}
                    className="flex flex-col gap-3 sm:flex-row"
                >
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <label
                            htmlFor="nombreFamiliaBusqueda"
                            className="text-sm font-semibold text-gray-700"
                        >
                            {t('family.searchByNameLabel')}
                        </label>

                        <input
                            id="nombreFamiliaBusqueda"
                            type="search"
                            value={nombreBusqueda}
                            onChange={(e) => {
                                setNombreBusqueda(e.target.value)
                                setErrorBusquedaNombre('')
                            }}
                            placeholder={t('family.searchByNamePlaceholder')}
                            autoComplete="off"
                            disabled={buscandoPorNombre || solicitandoAHogar !== null}
                            aria-invalid={errorBusquedaNombre ? 'true' : undefined}
                            className="w-full min-w-0 rounded-[9px] border border-gray-300 bg-white px-3.5 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={buscandoPorNombre || solicitandoAHogar !== null}
                        className="mt-1 flex shrink-0 items-center justify-center gap-2 self-end rounded-[9px] bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-px hover:bg-blue-700 active:scale-[0.99] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                        {buscandoPorNombre && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                        )}

                        {buscandoPorNombre
                            ? t('common.buscando')
                            : t('family.searchByNameSearch')}
                    </button>
                </form>

                {errorBusquedaNombre && (
                    <p
                        role="alert"
                        className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                    >
                        {errorBusquedaNombre}
                    </p>
                )}

                {busquedaHecha && coincidencias.length === 0 && (
                    <p className="mt-3 text-sm text-gray-500">
                        {t('family.searchByNameEmpty')}
                    </p>
                )}

                {coincidencias.length > 0 && (
                    <ul className="mt-4 space-y-3">
                        {coincidencias.map((familia) => (
                            <li
                                key={familia.idHogar}
                                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                            >
                                <p className="text-base font-bold text-gray-800">
                                    {familia.nombreFamiliar}
                                </p>

                                <button
                                    type="button"
                                    disabled={solicitandoAHogar !== null}
                                    onClick={() => solicitarUnionPorNombre(familia)}
                                    className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {solicitandoAHogar === familia.idHogar
                                        ? t('pendingHome.joinSending')
                                        : t('pendingHome.joinRequest')}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {/* MIS SOLICITUDES DE UNIÓN */}
                <h3 className="mb-2 mt-6 text-base font-bold text-gray-800">
                    {t('pendingHome.myRequests')}
                </h3>

                {errorSolicitud && (
                    <p
                        role="alert"
                        className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                    >
                        {errorSolicitud}
                    </p>
                )}

                {solicitudes.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        {t('pendingHome.noRequests')}
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {solicitudes.map((sol) => (
                            <li
                                key={sol.idSolicitud}
                                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="min-w-0 truncate text-sm font-semibold text-gray-800">
                                        {sol.nombreFamilia}
                                    </p>

                                    <span
                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                                            sol.estado === 'Aceptada'
                                                ? 'bg-green-100 text-green-700'
                                                : sol.estado === 'Rechazada' || sol.estado === 'Cancelada'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                        }`}
                                    >
                                        {sol.estado === 'Aceptada'
                                            ? t('family.accepted')
                                            : sol.estado === 'Rechazada'
                                                ? t('family.rejected')
                                                : sol.estado === 'Cancelada'
                                                    ? t('family.cancelled')
                                                    : t('family.pending')}
                                    </span>
                                </div>

                                <p className="mt-1 text-xs text-gray-500">
                                    {t('pendingHome.requestDate', {
                                        date: formatearFecha(sol.fechaSolicitud),
                                    })}
                                </p>

                                {sol.estado === 'Pendiente' && (
                                    <button
                                        type="button"
                                        disabled={cancelando === sol.idSolicitud}
                                        onClick={() => cancelarSolicitud(sol.idSolicitud)}
                                        className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        {cancelando === sol.idSolicitud
                                            ? t('common.procesando')
                                            : t('common.cancelar')}
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

            </section>

        </main>
    )
}
