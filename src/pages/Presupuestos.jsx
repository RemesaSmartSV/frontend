import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    categoriasApi,
    presupuestosApi,
    movimientosApi
} from '../services/api'

import Notification from '../components/Notification'
import ConfirmModal from '../components/ConfirmModal'
import Loading from '../components/Loading'
import Pagination from '../components/Pagination'
import FiltrosMenu from '../components/FiltrosMenu'
import { formatearMoneda, formatearNumero, formatearFecha } from '../utils/formato'

function Presupuestos() {
    const { t } = useTranslation()
    const [presupuestos, setPresupuestos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [movimientos, setMovimientos] = useState([])

    const [formulario, setFormulario] = useState({
        idCategoria: '',
        montoLimite: '',
        mesAnio: '',
    })

    const [editando, setEditando] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    const [confirmModal, setConfirmModal] = useState({
        abierto: false,
        id: null,
        mensaje: '',
    })

    const [filtros, setFiltros] = useState({
        idCategoria: '',
        mesAnio: '',
        montoMinimo: '',
        montoMaximo: '',
        busqueda: '',
    })

    // T4 — badge del botón "Filtros": criterios con valor, búsqueda incluida
    // (estrecha la lista aunque la búsqueda viva fuera del panel).
    const cantidadFiltrosActivos = useMemo(
        () =>
            Object.values(filtros).filter(
                (valor) => String(valor ?? '').trim() !== ''
            ).length,
        [filtros]
    )

    const [paginaActual, setPaginaActual] = useState(1)
    const registrosPorPagina = 5

    // ==========================================
    // CARGAR DATOS
    // ==========================================

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true)
            setError('')

            const [
                presupuestosData,
                categoriasData,
                movimientosData
            ] = await Promise.all([
                presupuestosApi.listar(),
                categoriasApi.listar(),
                movimientosApi.listar(),
            ])

            setPresupuestos(presupuestosData || [])
            setCategorias(categoriasData || [])
            setMovimientos(movimientosData || [])

            setPaginaActual(1)
        } catch (err) {
            setError(err.message || t('errors.generico'))
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        cargarDatos()
    }, [cargarDatos])

    // ==========================================
    // FORMULARIO
    // ==========================================

    const manejarCambio = (e) => {
        const { name, value } = e.target

        setFormulario((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const limpiarFormulario = () => {
        setFormulario({
            idCategoria: '',
            montoLimite: '',
            mesAnio: '',
        })

        setEditando(null)
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        setError('')
        setMensaje('')

        if (!formulario.idCategoria) {
            setError(t('budget.categoryRequired'))
            return
        }

        if (!formulario.montoLimite) {
            setError(t('budget.limitRequired'))
            return
        }

        if (Number(formulario.montoLimite) <= 0) {
            setError(t('budget.limitPositive'))
            return
        }

        if (!formulario.mesAnio) {
            setError(t('budget.monthRequired'))
            return
        }

        try {
            setProcesando(true)

            const datos = {
                idCategoria: Number(formulario.idCategoria),
                montoLimite: Number(formulario.montoLimite),
                mesAnio: `${formulario.mesAnio}-01`,
            }

            if (editando) {
                await presupuestosApi.actualizar(editando, datos)
                setMensaje(t('budget.updated'))
            } else {
                await presupuestosApi.crear(datos)
                setMensaje(t('budget.saved'))
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (err) {
            setError(err.message || t('errors.generico'))
        } finally {
            setProcesando(false)
        }
    }

    // ==========================================
    // EDITAR
    // ==========================================

    const editarPresupuesto = (presupuesto) => {
        setEditando(presupuesto.idPresupuesto)

        setFormulario({
            idCategoria: String(presupuesto.idCategoria),
            montoLimite: String(presupuesto.montoLimite),
            mesAnio: presupuesto.mesAnio
                ? presupuesto.mesAnio.substring(0, 7)
                : '',
        })

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    // ==========================================
    // ELIMINAR
    // ==========================================

    const solicitarEliminar = (id) => {
        setConfirmModal({
            abierto: true,
            id,
            mensaje: t('budget.deleteMessage'),
        })
    }

    const confirmarEliminar = async () => {
        try {
            setProcesando(true)
            setError('')

            await presupuestosApi.eliminar(confirmModal.id)

            setMensaje(t('budget.deleted'))

            setConfirmModal({
                abierto: false,
                id: null,
                titulo: t('budget.deleteTitle'),
                mensaje: '',
            })

            await cargarDatos()
        } catch (err) {
            setError(err.message || t('errors.generico'))
        } finally {
            setProcesando(false)
        }
    }

    // ==========================================
    // OBTENER CATEGORÍA
    // ==========================================

    const obtenerNombreCategoria = (idCategoria) => {
        const categoria = categorias.find(
            (item) =>
                Number(item.idCategoria) === Number(idCategoria)
        )

        return categoria?.nombre || t('common.sinCategoria')
    }

    // ==========================================
    // CALCULAR PROGRESO
    // ==========================================

    const obtenerProgresoPresupuesto = (presupuesto) => {
        const categoriaId = Number(presupuesto.idCategoria)

        const mesPresupuesto = presupuesto.mesAnio
            ? presupuesto.mesAnio.substring(0, 7)
            : ''

        const gastos = movimientos.filter((movimiento) => {
            const tipo = String(
                movimiento.tipo || ''
            ).toLowerCase()

            const fechaMovimiento = movimiento.fecha
                ? String(movimiento.fecha).substring(0, 7)
                : ''

            return (
                tipo === 'gasto' &&
                Number(movimiento.idCategoria) === categoriaId &&
                fechaMovimiento === mesPresupuesto
            )
        })

        const gastado = gastos.reduce(
            (total, movimiento) => {
                return total + Number(movimiento.monto || 0)
            },
            0
        )

        const limite = Number(
            presupuesto.montoLimite || 0
        )

        const porcentaje = limite > 0
            ? (gastado / limite) * 100
            : 0

        const porcentajeBarra = Math.min(
            Math.max(porcentaje, 0),
            100
        )

        let estado = 'normal'

        if (porcentaje >= 90) {
            estado = 'peligro'
        } else if (porcentaje >= 70) {
            estado = 'advertencia'
        }

        return {
            gastado,
            limite,
            porcentaje,
            porcentajeBarra,
            estado,
        }
    }

    // ==========================================
    // COLOR DE LA BARRA
    // ==========================================

    const obtenerColorBarra = (estado) => {
        if (estado === 'peligro') {
            return 'bg-red-500'
        }

        if (estado === 'advertencia') {
            return 'bg-yellow-400'
        }

        return 'bg-green-500'
    }

    // ==========================================
    // FILTROS
    // ==========================================

    const manejarCambioFiltro = (e) => {
        const { name, value } = e.target

        setFiltros((prev) => ({
            ...prev,
            [name]: value,
        }))

        setPaginaActual(1)
    }

    const limpiarFiltros = () => {
        setFiltros({
            idCategoria: '',
            mesAnio: '',
            montoMinimo: '',
            montoMaximo: '',
            busqueda: '',
        })

        setPaginaActual(1)
    }

    // ==========================================
    // FILTRAR PRESUPUESTOS
    // ==========================================

    const presupuestosFiltrados = useMemo(() => {
        return presupuestos.filter((presupuesto) => {
            const nombreCategoria =
                obtenerNombreCategoria(
                    presupuesto.idCategoria
                ).toLowerCase()

            const categoriaCoincide =
                !filtros.idCategoria ||
                Number(presupuesto.idCategoria) ===
                Number(filtros.idCategoria)

            const mesPresupuesto =
                presupuesto.mesAnio
                    ? presupuesto.mesAnio.substring(0, 7)
                    : ''

            const mesCoincide =
                !filtros.mesAnio ||
                mesPresupuesto === filtros.mesAnio

            const monto = Number(
                presupuesto.montoLimite || 0
            )

            const montoMinimoCoincide =
                !filtros.montoMinimo ||
                monto >= Number(filtros.montoMinimo)

            const montoMaximoCoincide =
                !filtros.montoMaximo ||
                monto <= Number(filtros.montoMaximo)

            const busquedaCoincide =
                !filtros.busqueda ||
                nombreCategoria.includes(
                    filtros.busqueda.toLowerCase()
                )

            return (
                categoriaCoincide &&
                mesCoincide &&
                montoMinimoCoincide &&
                montoMaximoCoincide &&
                busquedaCoincide
            )
        })
    }, [presupuestos, categorias, filtros])

    // ==========================================
    // PAGINACIÓN
    // ==========================================

    const totalPaginas = Math.ceil(
        presupuestosFiltrados.length /
        registrosPorPagina
    )

    const presupuestosPaginados = useMemo(() => {
        const inicio =
            (paginaActual - 1) *
            registrosPorPagina

        return presupuestosFiltrados.slice(
            inicio,
            inicio + registrosPorPagina
        )
    }, [
        presupuestosFiltrados,
        paginaActual,
    ])

    // ==========================================
    // EXPORTAR CSV
    // ==========================================

    const exportarCSV = () => {
        if (presupuestosFiltrados.length === 0) {
            setError(
                t('budget.exportEmpty')
            )
            return
        }

        const encabezados = [
            t('common.categoria'),
            t('budget.month'),
            t('budget.limit'),
            t('budget.spent'),
            t('budget.percentage'),
        ]

        const filas =
            presupuestosFiltrados.map(
                (presupuesto) => {
                    const progreso =
                        obtenerProgresoPresupuesto(
                            presupuesto
                        )

                    return [
                        obtenerNombreCategoria(
                            presupuesto.idCategoria
                        ),
                        presupuesto.mesAnio
                            ? presupuesto.mesAnio.substring(0, 7)
                            : '',
                        Number(
                            presupuesto.montoLimite
                        ).toFixed(2),
                        progreso.gastado.toFixed(2),
                        `${progreso.porcentaje.toFixed(2)}%`,
                    ]
                }
            )

        const contenido = [
            encabezados,
            ...filas,
        ]
            .map((fila) => fila.join(','))
            .join('\n')

        const blob = new Blob(
            [contenido],
            {
                type: 'text/csv;charset=utf-8;',
            }
        )

        const url =
            URL.createObjectURL(blob)

        const enlace =
            document.createElement('a')

        enlace.href = url
        enlace.download =
            'presupuestos.csv'

        document.body.appendChild(enlace)

        enlace.click()

        document.body.removeChild(enlace)

        URL.revokeObjectURL(url)
    }

    // ==========================================
    // CARGANDO
    // ==========================================

    if (cargando) {
        return <Loading />
    }

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="space-y-6">

            {/* ENCABEZADO */}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {t('nav.presupuestos')}
                    </h1>

                    <p className="text-gray-500">
                        {t('budget.description')}
                    </p>
                </div>

                <div className="flex gap-2">

                    <button
                        type="button"
                        onClick={exportarCSV}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                        {t('common.exportar')}
                    </button>

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
                <Notification
                    tipo="error"
                    mensaje={error}
                    onClose={() => setError('')}
                />
            )}

            {mensaje && (
                <Notification
                    tipo="success"
                    mensaje={mensaje}
                    onClose={() => setMensaje('')}
                />
            )}

            {/* FORMULARIO */}

            <div className="rounded-xl bg-white p-6 shadow-sm">

                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                    {editando
                        ? t('budget.edit')
                        : t('budget.create')}
                </h2>

                <form
                    onSubmit={manejarSubmit}
                    className="grid grid-cols-1 gap-4 md:grid-cols-3"
                >

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('common.categoria')}
                        </label>

                        <select
                            name="idCategoria"
                            value={formulario.idCategoria}
                            onChange={manejarCambio}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                        >
                            <option value="">
                                {t('common.seleccionaCategoria')}
                            </option>

                            {categorias
                                .filter(
                                    (categoria) =>
                                        String(
                                            categoria.tipo || ''
                                        ).toLowerCase() === 'gasto'
                                )
                                .map((categoria) => (
                                    <option
                                        key={
                                            categoria.idCategoria
                                        }
                                        value={
                                            categoria.idCategoria
                                        }
                                    >
                                        {categoria.nombre}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('budget.limit')}
                        </label>

                        <input
                            type="number"
                            name="montoLimite"
                            min="0.01"
                            step="0.01"
                            value={
                                formulario.montoLimite
                            }
                            onChange={manejarCambio}
                            placeholder="Ej. 100.00"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('budget.month')}
                        </label>

                        <input
                            type="month"
                            name="mesAnio"
                            value={
                                formulario.mesAnio
                            }
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
                                ? t('common.guardando')
                                : editando
                                    ? t('common.actualizar')
                                    : t('budget.create')}
                        </button>

                        {editando && (
                            <button
                                type="button"
                                onClick={
                                    limpiarFormulario
                                }
                                className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
                            >
                                {t('common.cancelar')}
                            </button>
                        )}

                    </div>

                </form>

            </div>

            {/* FILTROS */}

            <div className="rounded-xl bg-white p-6 shadow-sm">

                <div className="mb-4 flex items-center justify-between">

                    <h2 className="text-lg font-semibold text-gray-800">
                        {t('common.filtros')}
                    </h2>

                </div>

                {/* T4 — fila superior: la búsqueda queda SIEMPRE visible
                    (es el control de mayor uso); los otros cuatro controles
                    viven detrás del botón "Filtros" pero siguen montados en
                    el DOM: el panel sólo los oculta con la clase `hidden`,
                    nunca con render condicional. El texto-link "Limpiar
                    filtros" pasa al interior del panel vía onLimpiar. */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            {t('budget.filterSearch')}
                        </label>

                        <input
                            type="text"
                            name="busqueda"
                            value={
                                filtros.busqueda
                            }
                            onChange={
                                manejarCambioFiltro
                            }
                            placeholder={t('budget.searchPlaceholder')}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </div>

                    <FiltrosMenu
                        cantidadActivos={cantidadFiltrosActivos}
                        onLimpiar={limpiarFiltros}
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    {t('common.categoria')}
                                </label>

                                <select
                                    name="idCategoria"
                                    value={
                                        filtros.idCategoria
                                    }
                                    onChange={
                                        manejarCambioFiltro
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                >
                                    <option value="">
                                        {t('income.all')}
                                    </option>

                                    {categorias.map(
                                        (categoria) => (
                                            <option
                                                key={
                                                    categoria.idCategoria
                                                }
                                                value={
                                                    categoria.idCategoria
                                                }
                                            >
                                                {categoria.nombre}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    {t('budget.month')}
                                </label>

                                <input
                                    type="month"
                                    name="mesAnio"
                                    value={
                                        filtros.mesAnio
                                    }
                                    onChange={
                                        manejarCambioFiltro
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    {t('common.montoMinimo')}
                                </label>

                                <input
                                    type="number"
                                    name="montoMinimo"
                                    min="0"
                                    step="0.01"
                                    value={
                                        filtros.montoMinimo
                                    }
                                    onChange={
                                        manejarCambioFiltro
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    {t('common.montoMaximo')}
                                </label>

                                <input
                                    type="number"
                                    name="montoMaximo"
                                    min="0"
                                    step="0.01"
                                    value={
                                        filtros.montoMaximo
                                    }
                                    onChange={
                                        manejarCambioFiltro
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                />
                            </div>

                        </div>
                    </FiltrosMenu>

                </div>

            </div>

            {/* TABLA */}

            <div className="overflow-hidden rounded-xl bg-white shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[800px]">

                        <thead className="bg-gray-50">

                            <tr>

                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                    {t('common.categoria')}
                                </th>

                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                    {t('budget.month')}
                                </th>

                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                    {t('budget.limit')}
                                </th>

                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                    {t('budget.progress')}
                                </th>

                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                    {t('common.acciones')}
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-100">

                            {presupuestosPaginados.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="px-6 py-10 text-center text-gray-500"
                                    >
                                        {t('budget.empty')}
                                    </td>

                                </tr>

                            ) : (

                                presupuestosPaginados.map(
                                    (presupuesto) => {

                                        const progreso =
                                            obtenerProgresoPresupuesto(
                                                presupuesto
                                            )

                                        const colorBarra =
                                            obtenerColorBarra(
                                                progreso.estado
                                            )

                                        return (
                                            <tr
                                                key={
                                                    presupuesto.idPresupuesto
                                                }
                                                className="hover:bg-gray-50"
                                            >

                                                <td className="px-6 py-4">

                                                    <span className="font-medium text-gray-800">
                                                        {
                                                            obtenerNombreCategoria(
                                                                presupuesto.idCategoria
                                                            )
                                                        }
                                                    </span>

                                                </td>

                                                <td className="px-6 py-4 text-gray-600">

                                                    {presupuesto.mesAnio
                                                        ? formatearFecha(`${presupuesto.mesAnio.substring(0, 7)}-01`, { month: 'short', year: 'numeric' })
                                                        : '-'}

                                                </td>

                                                <td className="px-6 py-4 font-medium text-gray-800">

                                                    {formatearMoneda(presupuesto.montoLimite)}

                                                </td>

                                                <td className="px-6 py-4">

                                                    <div className="min-w-[180px]">

                                                        <div className="mb-1 flex justify-between text-xs">

                                                            <span className="text-gray-500">
                                                                {formatearMoneda(progreso.gastado)}
                                                            </span>

                                                            <span className="font-semibold text-gray-700">
                                                                {formatearNumero(progreso.porcentaje, { maximumFractionDigits: 0 })}
                                                                %
                                                            </span>

                                                        </div>

                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">

                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${colorBarra}`}
                                                                style={{
                                                                    width: `${progreso.porcentajeBarra}%`,
                                                                }}
                                                            />

                                                        </div>

                                                    </div>

                                                </td>

                                                <td className="px-6 py-4">

                                                    <div className="flex gap-2">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                editarPresupuesto(
                                                                    presupuesto
                                                                )
                                                            }
                                                            className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                                                        >
                                                            {t('common.editar')}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                solicitarEliminar(
                                                                    presupuesto.idPresupuesto
                                                                )
                                                            }
                                                            className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                                                        >
                                                            {t('common.eliminar')}
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        )
                                    }
                                )

                            )}

                        </tbody>

                    </table>

                </div>

                {totalPaginas > 1 && (
                    <div className="border-t border-gray-100 p-4">

                        <Pagination
                            paginaActual={
                                paginaActual
                            }
                            totalPaginas={
                                totalPaginas
                            }
                            cambiarPagina={
                                setPaginaActual
                            }
                        />

                    </div>
                )}

            </div>

            {/* MODAL DE CONFIRMACIÓN */}

            <ConfirmModal
                abierto={
                    confirmModal.abierto
                }
                titulo={t('budget.deleteTitle')}
                mensaje={
                    confirmModal.mensaje
                }
                onConfirmar={
                    confirmarEliminar
                }
                onCancelar={() =>
                    setConfirmModal({
                        abierto: false,
                        id: null,
                        mensaje: '',
                    })
                }
            />

        </div>
    )

}

export default Presupuestos
