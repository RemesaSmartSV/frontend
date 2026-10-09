import { useCallback, useEffect, useState } from 'react'
import {
    hogaresApi,
    usuariosApi,
    invitacionesApi,
} from '../services/api'

import Notification from '../components/Notification'
import Loading from '../components/Loading'

function formatearFecha(fecha) {
    if (!fecha) return '-'

    const valor = new Date(fecha)

    if (Number.isNaN(valor.getTime())) return '-'

    return valor.toLocaleDateString('es-SV', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

export default function MiHogar() {
    const [hogar, setHogar] = useState(null)
    const [miembros, setMiembros] = useState([])
    const [enviadas, setEnviadas] = useState([])
    const [cargando, setCargando] = useState(true)

    const [correo, setCorreo] = useState('')
    const [enviando, setEnviando] = useState(false)

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    // El token guardado por authApi.login trae el rol; un Admin puede invitar.
    let esAdmin = false

    try {
        const datos = JSON.parse(localStorage.getItem('usuario') || 'null')
        esAdmin = datos?.rol === 'Admin'
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
                setEnviadas(await invitacionesApi.enviadas())
            }
        } catch (err) {
            setError(err.message || 'No se pudo cargar la información del hogar.')
        } finally {
            setCargando(false)
        }
    }, [esAdmin])

    useEffect(() => {
        cargarDatos()
    }, [cargarDatos])

    async function invitar(e) {
        e.preventDefault()
        setError('')
        setMensaje('')

        if (!correo.trim()) {
            setError('Escribe el correo de la persona a invitar.')
            return
        }

        try {
            setEnviando(true)

            await invitacionesApi.invitar(correo.trim())

            setMensaje('Invitación enviada.')
            setCorreo('')
            setEnviadas(await invitacionesApi.enviadas())
        } catch (err) {
            setError(err.message || 'No se pudo enviar la invitación.')
        } finally {
            setEnviando(false)
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
                    {hogar?.nombreFamiliar || 'Mi familia'}
                </h1>

                <p className="text-gray-500">
                    Administra los miembros de tu familia y sus roles.
                </p>
            </div>

            {error && (
                <Notification tipo="error" mensaje={error} onClose={() => setError('')} />
            )}

            {mensaje && (
                <Notification tipo="success" mensaje={mensaje} onClose={() => setMensaje('')} />
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* MIEMBROS */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">
                        Miembros ({miembros.length})
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
                                        {miembro.correo} · Se unió {formatearFecha(miembro.fechaRegistro)}
                                    </p>
                                </div>

                                <span
                                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                                        miembro.rol === 'Admin'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    {miembro.rol === 'Admin' ? 'Administrador' : miembro.rol || 'Miembro'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* INVITAR + ESTADO DE INVITACIONES (solo Admin) */}
                {esAdmin ? (
                    <div className="space-y-6">
                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-800">
                                Invitar miembro
                            </h2>

                            <form onSubmit={invitar} className="flex flex-col gap-3 sm:flex-row">
                                <input
                                    type="email"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    aria-label="Correo de la persona a invitar"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                                />

                                <button
                                    type="submit"
                                    disabled={enviando}
                                    className="shrink-0 rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {enviando ? 'Enviando...' : 'Invitar'}
                                </button>
                            </form>

                            <p className="mt-2 text-sm text-gray-500">
                                La persona recibe una notificación y puede aceptar o rechazar.
                                Si aún no tiene cuenta, la invitación la espera registrada.
                            </p>
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-800">
                                Invitaciones enviadas
                            </h2>

                            {enviadas.length === 0 ? (
                                <p className="py-4 text-center text-sm text-gray-500">
                                No hay invitaciones enviadas todavía.
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
                                                    Enviada {formatearFecha(inv.fechaEnvio)}
                                                    {inv.fechaRespuesta
                                                        ? ` · Respondida ${formatearFecha(inv.fechaRespuesta)}`
                                                        : ''}
                                                </p>
                                            </div>

                                            <span
                                                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                                                    inv.estado === 'Aceptada'
                                                        ? 'bg-green-100 text-green-700'
                                                        : inv.estado === 'Rechazada'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                }`}
                                            >
                                                {inv.estado}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Solo un administrador de la familia puede invitar nuevos miembros.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
