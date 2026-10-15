import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { categoriasApi, movimientosApi } from '../services/api'
import Notification from '../components/Notification'
import ConfirmModal from '../components/ConfirmModal'
import Loading from '../components/Loading'
import Pagination from '../components/Pagination'
import { formatearMoneda, formatearFecha, obtenerFechaHoy } from '../utils/formato'

function Ingresos() {
    const { t } = useTranslation()
    const [ingresos, setIngresos] = useState([])
    const [categorias, setCategorias] = useState([])

    const [formulario, setFormulario] = useState({
        idCategoria: '',
        monto: '',
        fecha: obtenerFechaHoy(),
        descripcion: '',
    })

    const [editandoId, setEditandoId] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [procesando, setProcesando] = useState(false)
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [confirmModal, setConfirmModal] = useState({
        abierto: false,
        id: null,
        titulo: '',
        mensaje: '',
    })

    const [paginaActual, setPaginaActual] = useState(1)
    const registrosPorPagina = 5

    const [filtros, setFiltros] = useState({
        fechaDesde: '',
        fechaHasta: '',
        idCategoria: '',
        montoMinimo: '',
        montoMaximo: '',
        busqueda: '',
    })

    const cargarDatos = useCallback(async () => {
        setCargando(true)
        setError('')

        try {
            const [movimientosData, categoriasData] =
                await Promise.all([
                    movimientosApi.listar(),
                    categoriasApi.listar(),
                ])

            const ingresosFiltrados = movimientosData.filter(
                (movimiento) =>
                    movimiento.tipo === 'Ingreso' &&
                    !movimiento.origenEmisora
            )

            setIngresos(ingresosFiltrados)
            setCategorias(categoriasData)
            setPaginaActual(1)
        } catch (err) {
            console.error(err)
        setError(t('income.loadError'))
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        cargarDatos()
    }, [cargarDatos])

    function manejarCambio(e) {
        const { name, value } = e.target

        setFormulario({
            ...formulario,
            [name]: value,
        })
    }

    async function guardarIngreso(e) {
        e.preventDefault()
        setError('')
        setMensaje('')

        if (!formulario.idCategoria) {
            setError(t('expense.categoryRequired'))
            return
        }

        if (!formulario.monto || Number(formulario.monto) <= 0) {
            setError(t('expense.amountPositive'))
            return
        }

        if (!formulario.fecha) {
            setError(t('expense.dateRequired'))
            return
        }

        setProcesando(true)

        try {
            const movimiento = {
                idCategoria: Number(formulario.idCategoria),
                monto: Number(formulario.monto),
                fecha: formulario.fecha,
                tipo: 'Ingreso',
                descripcion: formulario.descripcion,
                origenEmisora: '',
            }

            if (editandoId) {
                await movimientosApi.actualizar(
                    editandoId,
                    movimiento
                )

                setMensaje(t('income.updated'))
            } else {
                await movimientosApi.crear(movimiento)

                setMensaje(t('income.saved'))
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (err) {
            console.error(err)
            setError(
                err.message ||
                t('income.saveError')
            )
        } finally {
            setProcesando(false)
        }
    }

    function editarIngreso(ingreso) {
        setEditandoId(ingreso.idMovimiento)

        setFormulario({
            idCategoria: ingreso.idCategoria || '',
            monto: ingreso.monto || '',
            fecha: ingreso.fecha?.split('T')[0] || '',
            descripcion: ingreso.descripcion || '',
        })

        setError('')
        setMensaje('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    function eliminarIngreso(id) {
        setConfirmModal({
            abierto: true,
            id,
            titulo: t('income.deleteTitle'),
            mensaje: t('income.deleteMessage'),
        })
    }

    async function confirmarEliminarIngreso() {
        const id = confirmModal.id
        setConfirmModal({ abierto: false, id: null, titulo: '', mensaje: '' })

        setProcesando(true)
        setError('')
        setMensaje('')

        try {
            await movimientosApi.eliminar(id)

            setMensaje(t('income.deleted'))

            await cargarDatos()
        } catch (err) {
            console.error(err)
            setError(t('income.deleteError'))
        } finally {
            setProcesando(false)
        }
    }

    function limpiarFormulario() {
        setFormulario({
            idCategoria: '',
            monto: '',
            fecha: obtenerFechaHoy(),
            descripcion: '',
        })

        setEditandoId(null)
    }

    function obtenerNombreCategoria(idCategoria) {
        const categoria = categorias.find(
            (c) => c.idCategoria === idCategoria
        )

        return categoria?.nombre || t('common.sinCategoria')
    }

    function manejarCambioFiltro(e) {
        const { name, value } = e.target

        setFiltros({
            ...filtros,
            [name]: value,
        })

        setPaginaActual(1)
    }

    function limpiarFiltros() {
        setFiltros({
            fechaDesde: '',
            fechaHasta: '',
            idCategoria: '',
            montoMinimo: '',
            montoMaximo: '',
            busqueda: '',
        })

        setPaginaActual(1)
    }

    const ingresosFiltradosPorUI = useMemo(() => {
        return ingresos.filter((ingreso) => {
            const fechaIngreso =
                ingreso.fecha?.split('T')[0] || ''

            const montoIngreso = Number(ingreso.monto)

            if (
                filtros.fechaDesde &&
                fechaIngreso < filtros.fechaDesde
            ) {
                return false
            }

            if (
                filtros.fechaHasta &&
                fechaIngreso > filtros.fechaHasta
            ) {
                return false
            }

            if (
                filtros.idCategoria &&
                String(ingreso.idCategoria) !==
                String(filtros.idCategoria)
            ) {
                return false
            }

            if (
                filtros.montoMinimo !== '' &&
                montoIngreso < Number(filtros.montoMinimo)
            ) {
                return false
            }

            if (
                filtros.montoMaximo !== '' &&
                montoIngreso > Number(filtros.montoMaximo)
            ) {
                return false
            }

            if (filtros.busqueda) {
                const termino = filtros.busqueda.toLowerCase()
                const descripcion = (ingreso.descripcion || '').toLowerCase()
                if (!descripcion.includes(termino)) {
                    return false
                }
            }

            return true
        })
    }, [ingresos, filtros])

    const totalPaginas = Math.ceil(
        ingresosFiltradosPorUI.length /
        registrosPorPagina
    )

    const indiceInicial =
        (paginaActual - 1) * registrosPorPagina

    const ingresosPagina =
        ingresosFiltradosPorUI.slice(
            indiceInicial,
            indiceInicial + registrosPorPagina
        )

    function cambiarPagina(nuevaPagina) {
        if (
            nuevaPagina < 1 ||
            nuevaPagina > totalPaginas
        ) {
            return
        }

        setPaginaActual(nuevaPagina)
    }

    function exportarIngresos() {
        if (ingresosFiltradosPorUI.length === 0) {
            setError(t('income.exportEmpty'))
            return
        }

        const encabezados = [
            t('common.fecha'),
            t('common.categoria'),
            t('common.monto'),
            t('common.descripcion'),
        ]

        const filas = ingresosFiltradosPorUI.map(
            (ingreso) => {
                const fecha =
                    ingreso.fecha?.split('T')[0] || ''

                const categoria =
                    obtenerNombreCategoria(
                        ingreso.idCategoria
                    )

                const monto = Number(
                    ingreso.monto
                ).toFixed(2)

                const descripcion =
                    ingreso.descripcion || ''

                return [
                    fecha,
                    categoria,
                    monto,
                    descripcion,
                ]
            }
        )

        function escaparCSV(valor) {
            let texto = String(valor).replace(/"/g, '""')

            if (/^[=+\-@\t\r]/.test(texto)) {
                texto = "'" + texto
            }

            return `"${texto}"`
        }

        const contenidoCSV = [
            encabezados
                .map(escaparCSV)
                .join(','),

            ...filas.map((fila) =>
                fila
                    .map(escaparCSV)
                    .join(',')
            ),
        ].join('\n')

        const BOM = '\uFEFF'

        const archivo = new Blob(
            [BOM + contenidoCSV],
            {
                type: 'text/csv;charset=utf-8;',
            }
        )

        const url =
            URL.createObjectURL(archivo)

        const enlace =
            document.createElement('a')

        enlace.href = url

        const fechaActual = obtenerFechaHoy()

        enlace.download =
            `ingresos_${fechaActual}.csv`

        document.body.appendChild(enlace)

        enlace.click()

        document.body.removeChild(enlace)

        URL.revokeObjectURL(url)

        setMensaje(t('income.exported', { count: ingresosFiltradosPorUI.length }))
    }

    const categoriasIngreso = categorias.filter(
        (categoria) =>
            categoria.tipo === 'Ingreso'
    )

    const hayFiltrosActivos =
        filtros.fechaDesde ||
        filtros.fechaHasta ||
        filtros.idCategoria ||
        filtros.montoMinimo !== '' ||
        filtros.montoMaximo !== '' ||
        filtros.busqueda !== ''

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    {t('nav.ingresos')}
                </h1>

                <p className="text-gray-500">
                    {t('income.description')}
                </p>
            </div>

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

            <section className="mb-6 rounded-[14px] bg-white p-5 shadow-[0_3px_12px_rgba(0,0,0,0.08)]">
                <h2 className="mb-4 text-xl font-semibold text-slate-900">
                    {editandoId
                        ? t('income.edit')
                        : t('income.create')}
                </h2>

                <form
                    onSubmit={guardarIngreso}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            {t('common.categoria')}
                        </label>

                        <select
                            name="idCategoria"
                            value={formulario.idCategoria}
                            onChange={manejarCambio}
                            disabled={procesando}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-gray-100"
                        >
                            <option value="">
                                {t('common.seleccionaCategoria')}
                            </option>

                            {categoriasIngreso.map(
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
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            {t('common.monto')}
                        </label>

                        <input
                            type="number"
                            name="monto"
                            value={formulario.monto}
                            onChange={manejarCambio}
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            disabled={procesando}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            {t('common.fecha')}
                        </label>

                        <input
                            type="date"
                            name="fecha"
                            value={formulario.fecha}
                            onChange={manejarCambio}
                            disabled={procesando}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-gray-100"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            {t('common.descripcion')}
                        </label>

                        <input
                            type="text"
                            name="descripcion"
                            value={formulario.descripcion}
                            onChange={manejarCambio}
                            placeholder={t('income.description')}
                            disabled={procesando}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                        />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row md:col-span-2">
                        <button
                            type="submit"
                            disabled={procesando}
                            className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {procesando
                                ? t('common.guardando')
                                : editandoId
                                    ? t('income.update')
                                    : t('income.save')}
                        </button>

                        {editandoId && (
                            <button
                                type="button"
                                onClick={limpiarFormulario}
                                disabled={procesando}
                                className="rounded-lg bg-gray-500 px-5 py-2.5 font-semibold text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {t('common.cancelar')}
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="rounded-[14px] bg-white p-5 shadow-[0_3px_12px_rgba(0,0,0,0.08)]">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <h2 className="text-xl font-semibold text-slate-900">
                            {t('income.registered')}
                        </h2>

                        <button
                            type="button"
                            onClick={exportarIngresos}
                            disabled={
                                cargando ||
                                procesando ||
                                ingresosFiltradosPorUI.length ===
                                0
                            }
                            className="w-full rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white transition hover:-translate-y-px hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {t('common.exportar')}
                        </button>
                    </div>

                    <button
                        onClick={cargarDatos}
                        disabled={
                            cargando || procesando
                        }
                        className="w-full rounded-lg bg-gray-700 px-4 py-2.5 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                        {cargando ? t('common.cargando') : t('common.actualizar')}
                    </button>
                </div>

                <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900">
                                {t('common.filtros')}
                            </h3>

                            <p className="text-sm text-slate-600">
                                {t('income.filtersDescription')}
                            </p>
                        </div>

                        {hayFiltrosActivos && (
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-100"
                            >
                                {t('common.limpiarFiltros')}
                            </button>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            {t('common.buscarDescripcion')}
                        </label>
                        <input
                            type="text"
                            name="busqueda"
                            value={filtros.busqueda}
                            onChange={manejarCambioFiltro}
                            placeholder={t('income.searchPlaceholder')}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                {t('common.fechaDesde')}
                            </label>

                            <input
                                type="date"
                                name="fechaDesde"
                                value={
                                    filtros.fechaDesde
                                }
                                onChange={
                                    manejarCambioFiltro
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                {t('common.fechaHasta')}
                            </label>

                            <input
                                type="date"
                                name="fechaHasta"
                                value={
                                    filtros.fechaHasta
                                }
                                onChange={
                                    manejarCambioFiltro
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
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
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                            >
                                <option value="">
                                    {t('income.all')}
                                </option>

                                {categoriasIngreso.map(
                                    (categoria) => (
                                        <option
                                            key={
                                                categoria.idCategoria
                                            }
                                            value={
                                                categoria.idCategoria
                                            }
                                        >
                                            {
                                                categoria.nombre
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                {t('common.montoMinimo')}
                            </label>

                            <input
                                type="number"
                                name="montoMinimo"
                                value={
                                    filtros.montoMinimo
                                }
                                onChange={
                                    manejarCambioFiltro
                                }
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                {t('common.montoMaximo')}
                            </label>

                            <input
                                type="number"
                                name="montoMaximo"
                                value={
                                    filtros.montoMaximo
                                }
                                onChange={
                                    manejarCambioFiltro
                                }
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-slate-600">
                        {t('income.count', { count: ingresosFiltradosPorUI.length })}
                    </div>
                </div>

                {cargando ? (
                    <Loading />
                ) : ingresos.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                        <p className="text-slate-600">
                            {t('income.empty')}
                        </p>
                    </div>
                ) : ingresosFiltradosPorUI.length ===
                    0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                        <p className="text-slate-600">
                            {t('income.emptyFiltered')}
                        </p>

                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                        >
                            {t('common.limpiarFiltros')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left">
                                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                                            {t('common.fecha')}
                                        </th>

                                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                                            {t('common.categoria')}
                                        </th>

                                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                                            {t('common.monto')}
                                        </th>

                                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                                            {t('common.descripcion')}
                                        </th>

                                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">
                                            {t('common.acciones')}
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {ingresosPagina.map(
                                        (ingreso) => (
                                            <tr
                                                key={
                                                    ingreso.idMovimiento
                                                }
                                                className="border-b border-slate-100 hover:bg-slate-50"
                                            >
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {ingreso.fecha ? formatearFecha(ingreso.fecha) : ''}
                                                </td>

                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {obtenerNombreCategoria(
                                                        ingreso.idCategoria
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-sm font-semibold text-green-600">
                                                    {formatearMoneda(ingreso.monto)}
                                                </td>

                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {ingreso.descripcion ||
                                                        t('common.sinDescripcion')}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                editarIngreso(
                                                                    ingreso
                                                                )
                                                            }
                                                            disabled={
                                                                procesando
                                                            }
                                                            className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                                                        >
                                                            {t('common.editar')}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                eliminarIngreso(
                                                                    ingreso.idMovimiento
                                                                )
                                                            }
                                                            disabled={
                                                                procesando
                                                            }
                                                            className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                                                        >
                                                            {t('common.eliminar')}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPaginas > 1 && (
                            <div className="mt-5">
                                <Pagination
                                    paginaActual={
                                        paginaActual
                                    }
                                    totalPaginas={
                                        totalPaginas
                                    }
                                    cambiarPagina={
                                        cambiarPagina
                                    }
                                />
                            </div>
                        )}
                    </>
                )}
            </section>
            <ConfirmModal
                abierto={confirmModal.abierto}
                titulo={confirmModal.titulo}
                mensaje={confirmModal.mensaje}
                onConfirmar={confirmarEliminarIngreso}
                onCancelar={() => setConfirmModal({ abierto: false, id: null, titulo: '', mensaje: '' })}
            />
        </div>
    )
}

export default Ingresos
