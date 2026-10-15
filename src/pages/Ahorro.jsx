import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ahorroApi } from '../services/api'
import { formatearMoneda, formatearNumero, formatearFecha } from '../utils/formato'

import Notification from '../components/Notification'
import ConfirmModal from '../components/ConfirmModal'
import Loading from '../components/Loading'
import Pagination from '../components/Pagination'

function Ahorro() {
    const { t } = useTranslation()
    const [metas, setMetas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    const [formulario, setFormulario] = useState({
        titulo: '',
        montoObjetivo: '',
        fechaLimite: '',
        descripcion: '',
    })

    const [editando, setEditando] = useState(null)

    const [aportes, setAportes] = useState([])
    const [metaDetalle, setMetaDetalle] = useState(null)
    const [aporteForm, setAporteForm] = useState({ monto: '', fecha: '' })
    const [aporteIdempotencyKey, setAporteIdempotencyKey] = useState(null)
    const [cargandoAportes, setCargandoAportes] = useState(false)

    const [confirmMeta, setConfirmMeta] = useState({ abierto: false, id: null })
    const [confirmAporte, setConfirmAporte] = useState({ abierto: false, id: null })

    const [paginaActual, setPaginaActual] = useState(1)
    const metasPorPagina = 6

    const limpiarFormulario = () => {
        setFormulario({
            titulo: '',
            montoObjetivo: '',
            fechaLimite: '',
            descripcion: '',
        })
        setEditando(null)
    }

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true)
            setError('')
            const datos = await ahorroApi.listarMetas()
            setMetas(datos || [])
            setPaginaActual(1)
        } catch (err) {
            setError(err.message || t('errors.generico'))
        } finally {
            setCargando(false)
        }
    }, [t])

    useEffect(() => {
        cargarDatos()
    }, [cargarDatos])

    const totalAhorro = metas.reduce(
        (total, meta) => total + Number(meta.montoActual || 0),
        0
    )
    const totalObjetivo = metas.reduce(
        (total, meta) => total + Number(meta.montoObjetivo || 0),
        0
    )

    const manejarCambio = (e) => {
        const { name, value } = e.target
        setFormulario((prev) => ({ ...prev, [name]: value }))
    }

    const validarFormulario = () => {
        if (!formulario.titulo.trim()) {
            setError(t('ahorro.goalTitleRequired'))
            return false
        }
        if (!formulario.montoObjetivo || Number(formulario.montoObjetivo) <= 0) {
            setError(t('ahorro.goalAmountPositive'))
            return false
        }
        if (!formulario.fechaLimite) {
            setError(t('ahorro.goalDateRequired'))
            return false
        }
        return true
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setMensaje('')

        if (!validarFormulario()) return

        try {
            setProcesando(true)

            const datos = {
                titulo: formulario.titulo.trim(),
                montoObjetivo: Number(formulario.montoObjetivo),
                fechaLimite: `${formulario.fechaLimite}T00:00:00Z`,
            }

            // El backend ignora descripcion/estado al actualizar; no se envía estado
            // para no forzar una transición no soportada.
            if (editando) {
                await ahorroApi.actualizarMeta(editando, datos)
                setMensaje(t('ahorro.metaActualizada'))
            } else {
                await ahorroApi.crearMeta(datos)
                setMensaje(t('ahorro.metaCreada'))
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (err) {
            setError(err.message || t('ahorro.goalSaveError'))
        } finally {
            setProcesando(false)
        }
    }

    const editarMeta = (meta) => {
        setEditando(meta.idMeta)
        setFormulario({
            titulo: meta.titulo || '',
            montoObjetivo: String(meta.montoObjetivo || ''),
            fechaLimite: meta.fechaLimite ? meta.fechaLimite.substring(0, 10) : '',
            descripcion: meta.descripcion || '',
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const solicitarEliminarMeta = (id) => {
        setConfirmMeta({ abierto: true, id })
    }

    const confirmarEliminarMeta = async () => {
        try {
            setProcesando(true)
            setError('')
            await ahorroApi.eliminarMeta(confirmMeta.id)
            if (metaDetalle && Number(metaDetalle.idMeta) === Number(confirmMeta.id)) {
                setMetaDetalle(null)
                setAportes([])
            }
            setMensaje(t('ahorro.metaEliminada'))
            setConfirmMeta({ abierto: false, id: null })
            await cargarDatos()
        } catch (err) {
            setError(err.message || t('ahorro.goalDeleteError'))
        } finally {
            setProcesando(false)
        }
    }

    const abrirDetalle = async (meta) => {
        try {
            setCargandoAportes(true)
            setMetaDetalle(meta)
            setAporteForm({ monto: '', fecha: '' })
            setAporteIdempotencyKey(null)
            const datos = await ahorroApi.listarAportes(meta.idMeta)
            setAportes(datos || [])
            setError('')
        } catch (err) {
            setError(err.message || t('ahorro.contributionLoadError'))
        } finally {
            setCargandoAportes(false)
        }
    }

    const manejarCambioAporte = (e) => {
        const { name, value } = e.target
        setAporteForm((prev) => ({ ...prev, [name]: value }))
        setAporteIdempotencyKey(null)
    }

    const registrarAporte = async (e) => {
        e.preventDefault()
        setError('')
        setMensaje('')

        const monto = Number(aporteForm.monto)

        if (!aporteForm.monto || monto <= 0) {
            setError(t('ahorro.contributionAmountPositive'))
            return
        }

        try {
            setProcesando(true)

            // Se conserva la misma clave si la petición falla y se reintenta;
            // cambiar monto/fecha la renueva desde manejarCambioAporte.
            const idempotencyKey = aporteIdempotencyKey || crypto.randomUUID()
            setAporteIdempotencyKey(idempotencyKey)

            await ahorroApi.crearAporte({
                idMeta: Number(metaDetalle.idMeta),
                monto,
                fecha: aporteForm.fecha ? `${aporteForm.fecha}T00:00:00Z` : new Date().toISOString(),
                idempotencyKey,
            })

            setMensaje(t('ahorro.aporteRegistrado'))
            setAporteForm({ monto: '', fecha: '' })
            setAporteIdempotencyKey(null)
            await abrirDetalle(metaDetalle)
            await cargarDatos()
        } catch (err) {
            setError(err.message || t('ahorro.contributionSaveError'))
        } finally {
            setProcesando(false)
        }
    }

    const solicitarEliminarAporte = (id) => {
        setConfirmAporte({ abierto: true, id })
    }

    const confirmarEliminarAporte = async () => {
        try {
            setProcesando(true)
            setError('')
            await ahorroApi.eliminarAporte(confirmAporte.id)
            setMensaje(t('ahorro.contributionDeleted'))
            setConfirmAporte({ abierto: false, id: null })
            if (metaDetalle) {
                await abrirDetalle(metaDetalle)
                await cargarDatos()
            }
        } catch (err) {
            setError(err.message || t('ahorro.contributionDeleteError'))
        } finally {
            setProcesando(false)
        }
    }

    const calcularProgreso = (meta) => {
        const objetivo = Number(meta.montoObjetivo || 0)
        const actual = Number(meta.montoActual || 0)
        const porcentaje = objetivo > 0 ? (actual / objetivo) * 100 : 0
        return {
            actual,
            objetivo,
            porcentaje,
            porcentajeBarra: Math.min(Math.max(porcentaje, 0), 100),
            restante: Math.max(objetivo - actual, 0),
        }
    }

    const colorBarra = (meta) => {
        if (
            String(meta.estado || '').toLowerCase() === 'completada' ||
            Number(meta.montoActual) >= Number(meta.montoObjetivo)
        ) {
            return 'bg-green-500'
        }
        return 'bg-blue-600'
    }

    // Cargando
    if (cargando) {
        return <Loading />
    }

    const totalPaginas = Math.max(Math.ceil(metas.length / metasPorPagina), 1)

    const metasPaginadas = metas.slice(
        (paginaActual - 1) * metasPorPagina,
        paginaActual * metasPorPagina
    )

    return (
        <div className="space-y-6">
            {/* ENCABEZADO */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t('ahorro.titulo')}</h1>
                    <p className="text-gray-500">{t('ahorro.subtitulo')}</p>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={cargarDatos}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {t('common.actualizar')}
                    </button>
                </div>
            </div>

            {/* NOTIFICACIONES */}
            {error && (
                <Notification tipo="error" mensaje={error} onClose={() => setError('')} />
            )}

            {mensaje && (
                <Notification tipo="success" mensaje={mensaje} onClose={() => setMensaje('')} />
            )}

            {/* TARJETAS RESUMEN */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">{t('ahorro.totalAhorrado')}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">
                        {formatearMoneda(totalAhorro)}
                    </p>
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">{t('ahorro.totalObjetivo')}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">
                        {formatearMoneda(totalObjetivo)}
                    </p>
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">{t('ahorro.progresoGlobal')}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">
                        {totalObjetivo > 0
                            ? `${formatearNumero((totalAhorro / totalObjetivo) * 100, { maximumFractionDigits: 0 })}%`
                            : '0%'}
                    </p>
                </div>
            </div>

            {/* FORMULARIO META */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                    {editando ? t('ahorro.editarMeta') : t('ahorro.crearMeta')}
                </h2>

                <form onSubmit={manejarSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label htmlFor="ahorro-meta-titulo" className="mb-1 block text-sm font-medium text-gray-700">
                            {t('ahorro.tituloMeta')}
                        </label>

                        <input
                            id="ahorro-meta-titulo"
                            type="text"
                            name="titulo"
                            value={formulario.titulo}
                            onChange={manejarCambio}
                            placeholder={t('ahorro.titlePlaceholder')}
                            maxLength={150}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="ahorro-meta-objetivo" className="mb-1 block text-sm font-medium text-gray-700">
                            {t('ahorro.montoObjetivo')}
                        </label>

                        <input
                            id="ahorro-meta-objetivo"
                            type="number"
                            name="montoObjetivo"
                            min="0.01"
                            step="0.01"
                            value={formulario.montoObjetivo}
                            onChange={manejarCambio}
                            placeholder={t('ahorro.amountPlaceholder')}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="ahorro-meta-fecha" className="mb-1 block text-sm font-medium text-gray-700">
                            {t('ahorro.fechaObjetivo')}
                        </label>

                        <input
                            id="ahorro-meta-fecha"
                            type="date"
                            name="fechaLimite"
                            value={formulario.fechaLimite}
                            onChange={manejarCambio}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex gap-2 md:col-span-3">
                        <button
                            type="submit"
                            disabled={procesando}
                            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {procesando
                                ? t('ahorro.saving')
                                : editando
                                    ? t('ahorro.updateGoal')
                                    : t('ahorro.createGoal')}
                        </button>

                        {editando && (
                            <button
                                type="button"
                                onClick={limpiarFormulario}
                                className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
                            >
                                {t('common.cancelar')}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* LISTADO DE METAS */}
            {metas.length === 0 ? (
                <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                    <p className="text-4xl">🐷</p>
                    <p className="mt-2 font-semibold text-gray-800">{t('ahorro.sinMetas')}</p>
                    <p className="text-sm text-gray-500">
                        {t('ahorro.firstGoalHint')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {metasPaginadas.map((meta) => {
                        const progreso = calcularProgreso(meta)

                        return (
                            <div key={meta.idMeta} className="rounded-xl bg-white p-6 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            {meta.titulo}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {t('ahorro.goalDate', { date: formatearFecha(meta.fechaLimite) })}
                                        </p>
                                    </div>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            String(meta.estado || '').toLowerCase() ===
                                            'completada'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}
                                    >
                                        {String(meta.estado || '').toLowerCase() === 'completada' ? t('ahorro.metaAlcanzada') : t('ahorro.inProgress')}
                                    </span>
                                </div>

                                <div className="mt-4">
                                    <div className="mb-1 flex justify-between text-xs text-gray-500">
                                        <span>{formatearMoneda(progreso.actual)}</span>
                                        <span className="font-semibold text-gray-700">
                                            {formatearNumero(progreso.porcentaje, { maximumFractionDigits: 0 })}%
                                        </span>
                                        <span>{formatearMoneda(progreso.objetivo)}</span>
                                    </div>

                                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${colorBarra(meta)}`}
                                            style={{
                                                width: `${progreso.porcentajeBarra}%`,
                                            }}
                                        />
                                    </div>

                                    <p className="mt-1 text-sm text-gray-500">
                                        {progreso.restante > 0
                                            ? t('ahorro.remainingAmount', { label: t('ahorro.restan'), amount: formatearMoneda(progreso.restante) })
                                            : t('ahorro.goalReached')}
                                    </p>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => abrirDetalle(meta)}
                                        className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                                    >
                                        {metaDetalle && Number(metaDetalle.idMeta) === Number(meta.idMeta)
                                            ? t('ahorro.contributionRegistered')
                                            : t('ahorro.registrarAporte')}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => editarMeta(meta)}
                                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                                    >
                                        {t('common.editar')}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => solicitarEliminarMeta(meta.idMeta)}
                                        className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                                    >
                                        {t('common.eliminar')}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* PAGINACIÓN */}
            {totalPaginas > 1 && (
                <Pagination
                    paginaActual={paginaActual}
                    totalPaginas={totalPaginas}
                    cambiarPagina={setPaginaActual}
                />
            )}

            {/* DETALLE / APORTES */}
            {metaDetalle && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">
                            {t('ahorro.contributionsFor', { title: metaDetalle.titulo })}
                        </h2>

                        <button
                            type="button"
                            onClick={() => {
                                setMetaDetalle(null)
                                setAportes([])
                                setAporteIdempotencyKey(null)
                            }}
                            className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {t('common.cerrar')}
                        </button>
                    </div>

                    <form onSubmit={registrarAporte} className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                        <label htmlFor="ahorro-aporte-monto" className="mb-1 block text-sm font-medium text-gray-700">
                            {t('ahorro.contributionAmount')}
                        </label>

                        <input
                            id="ahorro-aporte-monto"
                            type="number"
                            name="monto"
                                min="0.01"
                                step="0.01"
                                value={aporteForm.monto}
                                onChange={manejarCambioAporte}
                                placeholder={t('ahorro.amountPlaceholder')}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                        <label htmlFor="ahorro-aporte-fecha" className="mb-1 block text-sm font-medium text-gray-700">
                            {t('ahorro.contributionDate')}
                        </label>

                        <input
                            id="ahorro-aporte-fecha"
                            type="date"
                            name="fecha"
                                value={aporteForm.fecha}
                                onChange={manejarCambioAporte}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={procesando}
                                className="rounded-lg bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                {procesando ? t('common.cargando') : t('ahorro.registrarAporte')}
                            </button>
                        </div>
                    </form>

                    {cargandoAportes ? (
                        <Loading />
                    ) : aportes.length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-500">
                            {t('ahorro.noContributions')}
                        </p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {aportes.map((aporte) => (
                                <li key={aporte.idAporte} className="flex items-center justify-between py-3">
                                    <div>
                                        <span className="font-medium text-gray-800">
                                            {formatearMoneda(aporte.monto)}
                                        </span>
                                        <span className="ml-2 text-sm text-gray-500">
                                            · {formatearFecha(aporte.fecha)}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => solicitarEliminarAporte(aporte.idAporte)}
                                        className="rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
                                    >
                                        {t('common.eliminar')}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* MODALES DE CONFIRMACIÓN */}
            <ConfirmModal
                abierto={confirmMeta.abierto}
                titulo={t('ahorro.deleteGoal')}
                mensaje={t('ahorro.deleteGoalMessage')}
                onConfirmar={confirmarEliminarMeta}
                onCancelar={() => setConfirmMeta({ abierto: false, id: null })}
            />

            <ConfirmModal
                abierto={confirmAporte.abierto}
                titulo={t('ahorro.deleteContribution')}
                mensaje={t('ahorro.deleteContributionMessage')}
                onConfirmar={confirmarEliminarAporte}
                onCancelar={() => setConfirmAporte({ abierto: false, id: null })}
            />
        </div>
    )
}

export default Ahorro
