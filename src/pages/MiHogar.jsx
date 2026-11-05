import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router-dom'
import {
    Hash,
    Inbox,
    Send,
    TriangleAlert,
    UserPlus,
    Users,
} from 'lucide-react'
import {
    hogaresApi,
    usuariosApi,
    invitacionesApi,
    solicitudesUnionApi,
} from '../services/api'
import { formatearFecha } from '../utils/formato'

import Notification from '../components/Notification'
import Loading from '../components/Loading'
import ConfirmModal from '../components/ConfirmModal'
import { EncabezadoSeccion } from '../components/ui/EncabezadoSeccion'
import { EstadoVacio } from '../components/ui/EstadoVacio'
import { TONOS } from '../components/ui/ChipIcono'
import { CLASE_TARJETA } from '../components/ui/estilos'

export default function MiHogar() {
    const { t } = useTranslation()
    // Layout exposes salirDeFamilia and cambiarDeFamilia through the Outlet:
    // both refresh the session in App (a LoginResponse without a household);
    // the former navigates home and the latter to /hogar, where
    // HogarPendiente offers create/search. Outside the router (standalone
    // render of this file) the context arrives empty and a full page
    // navigation is used as a fallback.
    const contextoLayout = useOutletContext()
    const [hogar, setHogar] = useState(null)
    const [miembros, setMiembros] = useState([])
    const [enviadas, setEnviadas] = useState([])
    const [solicitudes, setSolicitudes] = useState([])
    const [resolviendo, setResolviendo] = useState(null)
    const [codigoCopiado, setCodigoCopiado] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [cambioFamiliaAbierto, setCambioFamiliaAbierto] = useState(false)

    const [correo, setCorreo] = useState('')
    const [enviando, setEnviando] = useState(false)

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    // URLs de foto de miembros que fallaron al cargar (se guarda la URL, no
    // el id, para que una foto nueva con ?v= distinto reintente). Va con el
    // resto de los states: cualquier return temprano no debe alterar el
    // orden de hooks.
    const [fotosRotas, setFotosRotas] = useState(() => new Set())

    // El token guardado por authApi.login trae el rol; un Admin puede invitar.
    let esAdmin = false
    let usuarioDatos = null

    try {
        usuarioDatos = JSON.parse(localStorage.getItem('usuario') || 'null')
        esAdmin = usuarioDatos?.rol === 'Admin'
    } catch {
        esAdmin = false
    }

    // Si la lista ya cargó y solo queda una persona, se muestra una
    // advertencia más fuerte al abandonar o cambiar de familia (el hogar y
    // sus datos financieros se conservan, §6.3). Se exige !cargando para no
    // contar a miembros mientras la lista sigue [].
    const esUltimoMiembro = !cargando && miembros.length === 1

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true)
            setError('')

            const [hogarData, miembrosData] = await Promise.all([
                hogaresApi.obtenerMiHogar(),
                usuariosApi.listar(),
            ])

            setHogar(hogarData)
            setMiembros(miembrosData || [])

            if (esAdmin) {
                // Recibidas devuelve 403 a un no-Admin: por eso solo se
                // pide cuando el rol guardado en localStorage es Admin.
                const [enviadasData, solicitudesData] = await Promise.all([
                    invitacionesApi.enviadas(),
                    solicitudesUnionApi.recibidas(),
                ])
                setEnviadas(enviadasData || [])
                setSolicitudes(solicitudesData || [])
            }
        } catch (err) {
            setError(err.message || t('family.loadError'))
        } finally {
            setCargando(false)
        }
    }, [esAdmin, t])

    useEffect(() => {
        cargarDatos()
    }, [cargarDatos])

    async function invitar(e) {
        e.preventDefault()
        setError('')
        setMensaje('')

        if (!correo.trim()) {
            setError(t('family.inviteEmailRequired'))
            return
        }

        try {
            setEnviando(true)

            await invitacionesApi.invitar(correo.trim())

            setMensaje(t('family.invitationSent'))
            setCorreo('')
            setEnviadas(await invitacionesApi.enviadas())
        } catch (err) {
            setError(err.message || t('family.inviteError'))
        } finally {
            setEnviando(false)
        }
    }

    async function copiarCodigo() {
        const codigo = hogar?.codigoPublico

        if (!codigo) return

        try {
            await navigator.clipboard.writeText(codigo)
            setCodigoCopiado(true)
            setTimeout(() => setCodigoCopiado(false), 2500)
        } catch {
            // Sin Clipboard API (contexto no seguro o navegador viejo):
            // se informa para que se copie a mano.
            setError(t('family.codeCopyError'))
        }
    }

    async function responderSolicitud(id, accion) {
        setError('')
        setMensaje('')

        try {
            setResolviendo(id)

            if (accion === 'aceptar') {
                await solicitudesUnionApi.aceptar(id)
                setMensaje(t('family.requestAccepted'))
            } else {
                await solicitudesUnionApi.rechazar(id)
                setMensaje(t('family.requestRejected'))
            }

            await cargarDatos()
        } catch (err) {
            // Incluye el 409 del backend (el usuario ya pertenece a una
            // familia): manejarRespuesta propaga el message tal cual.
            setError(err.message || t('family.requestError'))
        } finally {
            setResolviendo(null)
        }
    }

    if (cargando) {
        return <Loading />
    }

    // Switch family: leave the current one under the same rule as "leave"
    // (the household and its financial data are preserved, even for the last
    // member — §6.3) and drop the user on /hogar, where HogarPendiente
    // offers creating or searching for another family.
    async function cambiarDeFamilia() {
        setError('')
        setMensaje('')

        try {
            // The backend answers with a refreshed LoginResponse WITHOUT a
            // household; persist it exactly like the leave flow does.
            const datosUsuario = await usuariosApi.abandonarFamilia()
            localStorage.setItem('token', datosUsuario.token)
            localStorage.setItem('usuario', JSON.stringify(datosUsuario))

            setCambioFamiliaAbierto(false)

            if (typeof contextoLayout?.cambiarDeFamilia === 'function') {
                contextoLayout.cambiarDeFamilia(datosUsuario)
            } else {
                // Render outside the router (unit tests).
                window.location.assign('/hogar')
            }
        } catch (err) {
            setCambioFamiliaAbierto(false)
            setError(err.message || t('family.leaveError'))
        }
    }

    const iniciales = (nombre) =>
        String(nombre || '?')
            .split(' ')
            .map((parte) => parte.charAt(0))
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase()

    return (
        <div className="space-y-6">
            {/* ENCABEZADO */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                    {hogar?.nombreFamiliar || t('family.title')}
                </h1>

                <p className="mt-1 text-sm text-slate-500">{t('family.subtitle')}</p>
            </div>

            {error && (
                <Notification tipo="error" mensaje={error} onClose={() => setError('')} />
            )}

            {mensaje && (
                <Notification tipo="success" mensaje={mensaje} onClose={() => setMensaje('')} />
            )}

            {/* CÓDIGO PÚBLICO DE LA FAMILIA */}
            {hogar?.codigoPublico && (
                <div className={CLASE_TARJETA}>
                    <EncabezadoSeccion
                        Icono={Hash}
                        tono="azul"
                        titulo={t('family.publicCode')}
                        subtitulo={t('family.publicCodeHint')}
                    />

                    <div className="flex flex-wrap items-center gap-3">
                        <code className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 font-mono text-sm font-semibold tracking-wide text-gray-800 select-all">
                            {hogar.codigoPublico}
                        </code>

                        <button
                            type="button"
                            onClick={copiarCodigo}
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${TONOS.azul} hover:bg-blue-200`}
                        >
                            {codigoCopiado ? t('family.codeCopied') : t('family.copyCode')}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* MIEMBROS */}
                <div className={CLASE_TARJETA}>
                    <EncabezadoSeccion
                        Icono={Users}
                        tono="azul"
                        titulo={`${t('family.members')} (${miembros.length})`}
                    />

                    <ul className="divide-y divide-gray-100">
                        {miembros.map((miembro) => (
                            <li key={miembro.idUsuario} className="flex items-center gap-3 py-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                    {miembro.fotoPerfil && !fotosRotas.has(miembro.fotoPerfil) ? (
                                        <img
                                            src={miembro.fotoPerfil}
                                            alt=""
                                            className="h-full w-full object-cover"
                                            onError={() =>
                                                setFotosRotas((prev) =>
                                                    new Set(prev).add(miembro.fotoPerfil)
                                                )
                                            }
                                        />
                                    ) : (
                                        iniciales(miembro.nombre)
                                    )}
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-gray-800">
                                        {miembro.nombre}
                                    </p>

                                    <p className="truncate text-sm text-gray-500">
                                        {miembro.correo} · {t('family.joined', { date: formatearFecha(miembro.fechaRegistro) })}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    {esAdmin && miembro.idUsuario !== usuarioDatos?.idUsuario ? (
                                        <>
                                            <select
                                                value={miembro.rol || 'Miembro'}
                                                onChange={async (e) => {
                                                    try {
                                                        await usuariosApi.actualizarMiembro(miembro.idUsuario, { rol: e.target.value })
                                                        setMensaje(t('family.roleUpdated', { name: miembro.nombre }))
                                                        await cargarDatos()
                                                    } catch (err) {
                                                        setError(err.message || t('family.roleError'))
                                                    }
                                                }}
                                                aria-label={t('family.roleOf', { name: miembro.nombre })}
                                                className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                                            >
                                                <option value="Admin">{t('family.admin')}</option>
                                                <option value="Miembro">{t('family.member')}</option>
                                            </select>

                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!window.confirm(t('family.removeMember', { name: miembro.nombre }))) return
                                                    try {
                                                        await usuariosApi.eliminarMiembro(miembro.idUsuario)
                                                        setMensaje(t('family.memberRemoved', { name: miembro.nombre }))
                                                        await cargarDatos()
                                                    } catch (err) {
                                                        setError(err.message || t('family.removeError'))
                                                    }
                                                }}
                                                className={`rounded-lg px-2 py-1 text-xs font-medium transition ${TONOS.rojo} hover:bg-red-200`}
                                            >
                                                {t('family.remove')}
                                            </button>
                                        </>
                                    ) : (
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                miembro.rol === 'Admin'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {miembro.rol === 'Admin' ? t('family.admin') : t('family.member')}
                                        </span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* INVITAR + ESTADO DE INVITACIONES (solo Admin) */}
                {esAdmin ? (
                    <div className="space-y-6">
                        <div className={CLASE_TARJETA}>
                            <EncabezadoSeccion
                                Icono={UserPlus}
                                tono="verde"
                                titulo={t('family.invite')}
                            />

                            <form onSubmit={invitar} className="flex flex-col gap-3 sm:flex-row">
                                <input
                                    type="email"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    placeholder={t('auth.emailExample')}
                                    aria-label={t('family.inviteEmail')}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                                />

                                <button
                                    type="submit"
                                    disabled={enviando}
                                    className="shrink-0 rounded-lg bg-[#123B8F] px-5 py-2 font-medium text-white transition hover:bg-[#0B2E6B] disabled:opacity-50"
                                >
                                    {enviando ? t('common.enviando') : t('family.invite')}
                                </button>
                            </form>

                            <p className="mt-2 text-sm text-gray-500">
                                {t('family.inviteInfo')}
                            </p>
                        </div>

                        {/* SOLICITUDES DE UNIÓN RECIBIDAS (solo Admin) */}
                        <div className={CLASE_TARJETA}>
                            <EncabezadoSeccion
                                Icono={Inbox}
                                tono="ambar"
                                titulo={t('family.joinRequests')}
                                subtitulo={t('family.joinRequestsHint')}
                            />

                            {solicitudes.length === 0 ? (
                                <EstadoVacio
                                    Icono={Inbox}
                                    texto={t('family.noJoinRequests')}
                                    className="py-6"
                                />
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {solicitudes.map((sol) => (
                                        <li key={sol.idSolicitud} className="flex items-center justify-between gap-3 py-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-800">
                                                    {sol.nombreSolicitante}
                                                </p>

                                                <p className="truncate text-xs text-gray-500">
                                                    {sol.correoSolicitante} · {t('family.joinRequestDate', { date: formatearFecha(sol.fechaSolicitud) })}
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <button
                                                    type="button"
                                                    disabled={resolviendo === sol.idSolicitud}
                                                    onClick={() => responderSolicitud(sol.idSolicitud, 'aceptar')}
                                                    className={`rounded-lg px-2 py-1 text-xs font-medium transition ${TONOS.verde} hover:bg-green-200 disabled:opacity-50`}
                                                >
                                                    {t('common.aceptar')}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={resolviendo === sol.idSolicitud}
                                                    onClick={() => responderSolicitud(sol.idSolicitud, 'rechazar')}
                                                    className={`rounded-lg px-2 py-1 text-xs font-medium transition ${TONOS.rojo} hover:bg-red-200 disabled:opacity-50`}
                                                >
                                                    {t('common.rechazar')}
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className={CLASE_TARJETA}>
                            <EncabezadoSeccion
                                Icono={Send}
                                tono="violeta"
                                titulo={t('family.sentInvitations')}
                            />

                            {enviadas.length === 0 ? (
                                <EstadoVacio
                                    Icono={Send}
                                    texto={t('family.noInvitations')}
                                    className="py-6"
                                />
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {enviadas.map((inv) => (
                                        <li key={inv.idInvitacion} className="flex items-center justify-between gap-3 py-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-800">
                                                    {inv.correo}
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    {t('family.invitationDate', { date: formatearFecha(inv.fechaEnvio) })}
                                                    {inv.fechaRespuesta
                                                        ? t('family.answeredDate', { date: formatearFecha(inv.fechaRespuesta) })
                                                        : ''}
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        inv.estado === 'Aceptada'
                                                            ? 'bg-green-100 text-green-700'
                                                            : inv.estado === 'Rechazada' || inv.estado === 'Cancelada'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                    }`}
                                                >
                                                    {inv.estado === 'Aceptada' ? t('family.accepted') : inv.estado === 'Rechazada' ? t('family.rejected') : inv.estado === 'Cancelada' ? t('family.cancelled') : t('family.pending')}
                                                </span>

                                                {inv.estado === 'Pendiente' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                try {
                                                                    await invitacionesApi.reenviar(inv.idInvitacion)
                                                                    setMensaje(t('family.resendSuccess'))
                                                                    setEnviadas(await invitacionesApi.enviadas())
                                                                } catch (err) {
                                                                    setError(err.message || t('family.resendError'))
                                                                }
                                                            }}
                                                            className={`rounded-lg px-2 py-1 text-xs font-medium transition ${TONOS.azul} hover:bg-blue-200`}
                                                        >
                                                            {t('family.resend')}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                if (!window.confirm(t('family.cancelInvitation') + '?')) return
                                                                try {
                                                                    await invitacionesApi.cancelar(inv.idInvitacion)
                                                                    setMensaje(t('family.cancelSuccess'))
                                                                    setEnviadas(await invitacionesApi.enviadas())
                                                                } catch (err) {
                                                                    setError(err.message || t('family.cancelError'))
                                                                }
                                                            }}
                                                            className={`rounded-lg px-2 py-1 text-xs font-medium transition ${TONOS.rojo} hover:bg-red-200`}
                                                        >
                                                            {t('family.cancelInvitation')}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={CLASE_TARJETA}>
                        <p className="text-sm text-gray-500">
                                    {t('family.soloAdmin')}
                        </p>
                    </div>
                )}
            </div>

            {/* ABANDONAR FAMILIA */}
            {/* border-red-200! gana a border-slate-100 de CLASE_TARJETA:
                Tailwind ordena slate después que rojo en el CSS generado. */}
            <div className={`${CLASE_TARJETA} border-red-200!`}>
                <EncabezadoSeccion
                    Icono={TriangleAlert}
                    tono="rojo"
                    titulo={t('family.riskZone')}
                />
                <p className="mb-4 text-sm text-gray-500">
                    {esUltimoMiembro ? t('family.leaveWarningLast') : t('family.leaveWarning')}
                </p>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={async () => {
                            const aviso = esUltimoMiembro ? t('family.leaveConfirmLast') : t('family.leaveConfirm')
                            if (!window.confirm(aviso)) return
                            try {
                                // El backend responde un LoginResponse refrescado
                                // SIN hogar; el hogar y sus datos financieros se
                                // conservan (§6.3 Caso A), incluso si era el
                                // último miembro.
                                const datosUsuario = await usuariosApi.abandonarFamilia()
                                localStorage.setItem('token', datosUsuario.token)
                                localStorage.setItem('usuario', JSON.stringify(datosUsuario))

                                // Sin window.location.reload(): App toma el nuevo
                                // LoginResponse y Layout navega al inicio, así que
                                // el usuario queda en la app, con la sesión
                                // actualizada y sin familia. Nadie es empujado a
                                // entrar a otra: la pantalla de creación/búsqueda
                                // solo aparece si se entra a /hogar.
                                if (typeof contextoLayout?.salirDeFamilia === 'function') {
                                    contextoLayout.salirDeFamilia(datosUsuario)
                                } else {
                                    // Render fuera del router (tests unitarios).
                                    window.location.assign('/')
                                }
                            } catch (err) {
                                setError(err.message || t('family.leaveError'))
                            }
                        }}
                        className="rounded-lg border border-red-300 bg-white px-5 py-2.5 font-medium text-red-700 transition hover:bg-red-50"
                    >
                        {t('family.leave')}
                    </button>

                    <button
                        type="button"
                        onClick={() => setCambioFamiliaAbierto(true)}
                        className="rounded-lg border border-red-300 bg-white px-5 py-2.5 font-medium text-red-700 transition hover:bg-red-50"
                    >
                        {t('family.switchFamily')}
                    </button>
                </div>
            </div>

            {/* MODAL: CAMBIAR DE FAMILIA */}
            <ConfirmModal
                abierto={cambioFamiliaAbierto}
                titulo={t('family.switchFamily')}
                mensaje={esUltimoMiembro ? t('family.leaveConfirmLast') : t('family.leaveConfirm')}
                onConfirmar={cambiarDeFamilia}
                onCancelar={() => setCambioFamiliaAbierto(false)}
                textoConfirmar={t('family.switchConfirm')}
            />
        </div>
    )
}
