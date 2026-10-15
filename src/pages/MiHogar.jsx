import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    hogaresApi,
    usuariosApi,
    invitacionesApi,
    solicitudesUnionApi,
} from '../services/api'
import { formatearFecha } from '../utils/formato'

import Notification from '../components/Notification'
import Loading from '../components/Loading'

export default function MiHogar() {
    const { t } = useTranslation()
    const [hogar, setHogar] = useState(null)
    const [miembros, setMiembros] = useState([])
    const [enviadas, setEnviadas] = useState([])
    const [solicitudes, setSolicitudes] = useState([])
    const [resolviendo, setResolviendo] = useState(null)
    const [codigoCopiado, setCodigoCopiado] = useState(false)
    const [cargando, setCargando] = useState(true)

    const [correo, setCorreo] = useState('')
    const [enviando, setEnviando] = useState(false)

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    // El token guardado por authApi.login trae el rol; un Admin puede invitar.
    let esAdmin = false
    let usuarioDatos = null

    try {
        usuarioDatos = JSON.parse(localStorage.getItem('usuario') || 'null')
        esAdmin = usuarioDatos?.rol === 'Admin'
    } catch {
        esAdmin = false
    }

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
                <h1 className="text-2xl font-bold text-gray-800">
                    {hogar?.nombreFamiliar || t('family.title')}
                </h1>

                <p className="text-gray-500">{t('familia.subtitulo')}</p>
            </div>

            {error && (
                <Notification tipo="error" mensaje={error} onClose={() => setError('')} />
            )}

            {mensaje && (
                <Notification tipo="success" mensaje={mensaje} onClose={() => setMensaje('')} />
            )}

            {/* CÓDIGO PÚBLICO DE LA FAMILIA */}
            {hogar?.codigoPublico && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-2 text-lg font-semibold text-gray-800">
                        {t('family.publicCode')}
                    </h2>

                    <p className="mb-4 text-sm text-gray-500">
                        {t('family.publicCodeHint')}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                        <code className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 font-mono text-sm font-semibold tracking-wide text-gray-800 select-all">
                            {hogar.codigoPublico}
                        </code>

                        <button
                            type="button"
                            onClick={copiarCodigo}
                            className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                        >
                            {codigoCopiado ? t('family.codeCopied') : t('family.copyCode')}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* MIEMBROS */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">
                        {t('familia.miembros')} ({miembros.length})
                    </h2>

                    <ul className="divide-y divide-gray-100">
                        {miembros.map((miembro) => (
                            <li key={miembro.idUsuario} className="flex items-center gap-3 py-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                    {iniciales(miembro.nombre)}
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
                                                className="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
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
                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-800">
                                {t('familia.invitar')}
                            </h2>

                            <form onSubmit={invitar} className="flex flex-col gap-3 sm:flex-row">
                                <input
                                    type="email"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    aria-label={t('family.inviteEmail')}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                                />

                                <button
                                    type="submit"
                                    disabled={enviando}
                                    className="shrink-0 rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {enviando ? t('common.enviando') : t('family.invite')}
                                </button>
                            </form>

                            <p className="mt-2 text-sm text-gray-500">
                                {t('family.inviteInfo')}
                            </p>
                        </div>

                        {/* SOLICITUDES DE UNIÓN RECIBIDAS (solo Admin) */}
                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <h2 className="mb-1 text-lg font-semibold text-gray-800">
                                {t('family.joinRequests')}
                            </h2>

                            <p className="mb-4 text-sm text-gray-500">
                                {t('family.joinRequestsHint')}
                            </p>

                            {solicitudes.length === 0 ? (
                                <p className="py-4 text-center text-sm text-gray-500">
                                    {t('family.noJoinRequests')}
                                </p>
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
                                                    className="rounded-lg bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
                                                >
                                                    {t('common.aceptar')}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={resolviendo === sol.idSolicitud}
                                                    onClick={() => responderSolicitud(sol.idSolicitud, 'rechazar')}
                                                    className="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                                                >
                                                    {t('common.rechazar')}
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-800">
                                    {t('familia.invitacionesEnviadas')}
                            </h2>

                            {enviadas.length === 0 ? (
                                <p className="py-4 text-center text-sm text-gray-500">
                                {t('family.noInvitations')}
                                </p>
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
                                                            className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
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
                                                            className="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
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
                    <div className="rounded-xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-gray-500">
                                    {t('familia.soloAdmin')}
                        </p>
                    </div>
                )}
            </div>

            {/* ABANDONAR FAMILIA */}
            <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-lg font-semibold text-red-700">Zona de riesgo</h2>
                <p className="mb-4 text-sm text-gray-500">
                    Si abandonas la familia, perderás acceso a sus movimientos, presupuestos y metas compartidas.
                    Tus datos personales no se eliminarán.
                </p>

                <button
                    type="button"
                    onClick={async () => {
                        if (!window.confirm('¿Estás seguro de que deseas abandonar esta familia? Perderás acceso a sus movimientos, presupuestos y metas compartidas. Tus datos personales no se eliminarán.')) return
                        try {
                            const datosUsuario = await usuariosApi.abandonarFamilia()
                            localStorage.setItem('token', datosUsuario.token)
                            localStorage.setItem('usuario', JSON.stringify(datosUsuario))
                            window.location.reload()
                        } catch (err) {
                            setError(err.message || 'No se pudo abandonar la familia.')
                        }
                    }}
                    className="rounded-lg border border-red-300 bg-white px-5 py-2.5 font-medium text-red-700 transition hover:bg-red-50"
                >
                    Abandonar familia
                </button>
            </div>
        </div>
    )
}
