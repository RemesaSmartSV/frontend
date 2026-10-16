import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { categoriasApi, movimientosApi, usuariosApi } from '../services/api'
import Notification from '../components/Notification'
import Loading from '../components/Loading'
import Pagination from '../components/Pagination'
import ConfirmModal from '../components/ConfirmModal'
import { formatearMoneda, formatearFecha, obtenerFechaHoy } from '../utils/formato'
import { Download } from 'lucide-react'

export default function Movimientos() {
    const { t } = useTranslation()
    const [movimientos, setMovimientos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [miembros, setMiembros] = useState([])

    const [formulario, setFormulario] = useState({
        idCategoria: '',
        monto: '',
        fecha: obtenerFechaHoy(),
        tipo: 'Ingreso',
        descripcion: '',
        origenEmisora: '',
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

    // =========================
    // FILTROS
    // =========================

    const [filtros, setFiltros] = useState({
        fechaDesde: '',
        fechaHasta: '',
        idCategoria: '',
        idUsuario: '',
        montoMinimo: '',
        montoMaximo: '',
        busqueda: '',
    })

    // =========================
    // PAGINACIÓN
    // =========================

    const [paginaActual, setPaginaActual] = useState(1)
    const registrosPorPagina = 5

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true)
            setError('')

            const [movimientosData, categoriasData, miembrosData] =
                await Promise.all([
                    movimientosApi.listar(),
                    categoriasApi.listar(),
                    usuariosApi.listar(),
                ])

            setMovimientos(movimientosData)
            setCategorias(categoriasData)
            setMiembros(miembrosData || [])
            setPaginaActual(1)
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        cargarDatos()
    }, [cargarDatos])

    function manejarCambio(e) {
        const { name, value } = e.target

        if (name === 'tipo') {
            setFormulario({
                ...formulario,
                [name]: value,
                idCategoria: '',
            })
        } else {
            setFormulario({
                ...formulario,
                [name]: value,
            })
        }
    }

    async function guardarMovimiento(e) {
        e.preventDefault()

        if (!formulario.idCategoria) {
            setError(t('common.seleccionaCategoria'))
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

        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            const movimiento = {
                idCategoria: Number(formulario.idCategoria),
                monto: Number(formulario.monto),
                fecha: formulario.fecha,
                tipo: formulario.tipo,
                descripcion: formulario.descripcion,
                origenEmisora: formulario.origenEmisora,
            }

            if (editandoId) {
                await movimientosApi.actualizar(
                    editandoId,
                    movimiento
                )

                setMensaje(
                    t('transactions.updated')
                )
            } else {
                await movimientosApi.crear(movimiento)

                setMensaje(
                    t('transactions.saved')
                )
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (err) {
            setError(err.message)
        } finally {
            setProcesando(false)
        }
    }

    function editarMovimiento(movimiento) {
        setEditandoId(movimiento.idMovimiento)

        setFormulario({
            idCategoria: movimiento.idCategoria,
            monto: movimiento.monto,
            fecha: movimiento.fecha?.split('T')[0] || '',
            tipo: movimiento.tipo,
            descripcion: movimiento.descripcion || '',
            origenEmisora: movimiento.origenEmisora || '',
        })

        setMensaje('')
        setError('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    function eliminarMovimiento(id) {
        setConfirmModal({
            abierto: true,
            id,
            titulo: t('transactions.deleteTitle'),
            mensaje:
                t('transactions.deleteMessage'),
        })
    }

    async function confirmarEliminarMovimiento() {
        const id = confirmModal.id

        setConfirmModal({
            abierto: false,
            id: null,
            titulo: '',
            mensaje: '',
        })

        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            await movimientosApi.eliminar(id)

            setMensaje(
                t('transactions.deleted')
            )

            await cargarDatos()
        } catch (err) {
            setError(err.message)
        } finally {
            setProcesando(false)
        }
    }

    async function exportarMovimientosRemotos(formato) {
        try {
            setError('')
            await movimientosApi.exportar(formato)
        } catch (err) {
            setError(err.message)
        }
    }

    function limpiarFormulario() {
        setEditandoId(null)

        setFormulario({
            idCategoria: '',
            monto: '',
            fecha: obtenerFechaHoy(),
            tipo: 'Ingreso',
            descripcion: '',
            origenEmisora: '',
        })
    }

    // =========================
    // MANEJO DE FILTROS
    // =========================

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
            idUsuario: '',
            montoMinimo: '',
            montoMaximo: '',
            busqueda: '',
        })

        setPaginaActual(1)
    }

    // =========================
    // FILTRADO
    // =========================

    // Map idUsuario → nombre para atribuir cada movimiento. Se prefiere
    // NombreVisible; si no existe, se arma "Nombre Apellido" sin espacios de
    // sobra. Un id huérfano (no está en /Usuarios) degrada a "Desconocido".
    const nombresPorUsuario = useMemo(() => {
        const map = new Map()

        miembros.forEach((miembro) => {
            const nombre = (
                miembro.nombreVisible ||
                `${miembro.nombre || ''} ${miembro.apellido || ''}`
            ).trim()

            map.set(miembro.idUsuario, nombre)
        })

        return map
    }, [miembros])

    function nombreDeUsuario(idUsuario) {
        return (
            nombresPorUsuario.get(idUsuario) ||
            t('transactions.unknownUser')
        )
    }

    const movimientosFiltrados = useMemo(() => {
        return movimientos.filter((movimiento) => {
            if (filtros.fechaDesde) {
                const fechaMovimiento =
                    movimiento.fecha?.split('T')[0]

                if (fechaMovimiento < filtros.fechaDesde) {
                    return false
                }
            }

            if (filtros.fechaHasta) {
                const fechaMovimiento =
                    movimiento.fecha?.split('T')[0]

                if (fechaMovimiento > filtros.fechaHasta) {
                    return false
                }
            }

            if (filtros.idCategoria) {
                if (
                    String(movimiento.idCategoria) !==
                    String(filtros.idCategoria)
                ) {
                    return false
                }
            }

            if (filtros.idUsuario) {
                if (
                    String(movimiento.idUsuario) !==
                    String(filtros.idUsuario)
                ) {
                    return false
                }
            }

            if (filtros.montoMinimo !== '') {
                if (
                    Number(movimiento.monto) <
                    Number(filtros.montoMinimo)
                ) {
                    return false
                }
            }

            if (filtros.montoMaximo !== '') {
                if (
                    Number(movimiento.monto) >
                    Number(filtros.montoMaximo)
                ) {
                    return false
                }
            }

            if (filtros.busqueda) {
                const termino =
                    filtros.busqueda.toLowerCase()

                const descripcion =
                    (movimiento.descripcion || '').toLowerCase()

                const origen =
                    (movimiento.origenEmisora || '').toLowerCase()

                if (
                    !descripcion.includes(termino) &&
                    !origen.includes(termino)
                ) {
                    return false
                }
            }

            return true
        })
    }, [movimientos, filtros])

    // =========================
    // EXPORTAR CSV
    // =========================

    function exportarMovimientosCSV() {
        if (movimientosFiltrados.length === 0) {
            setError(t('transactions.exportEmpty'))
            return
        }

        const encabezados = [
            t('common.fecha'),
            t('common.tipo'),
            t('common.categoria'),
            t('common.monto'),
            t('common.descripcion'),
            t('common.origen'),
            t('transactions.registeredBy'),
        ]

        const filas = movimientosFiltrados.map(
            (movimiento) => {
                const categoria = categorias.find(
                    (c) =>
                        c.idCategoria ===
                        movimiento.idCategoria
                )

                const fecha =
                    movimiento.fecha?.split('T')[0] || ''

                const tipo =
                    movimiento.tipo || ''

                const nombreCategoria =
                    categoria?.nombre ||
                    t('common.sinCategoria')

                const monto =
                    Number(movimiento.monto).toFixed(2)

                const descripcion =
                    movimiento.descripcion || ''

                const origen =
                    movimiento.origenEmisora || ''

                const registradoPor =
                    nombreDeUsuario(movimiento.idUsuario)

                return [
                    fecha,
                    tipo,
                    nombreCategoria,
                    monto,
                    descripcion,
                    origen,
                    registradoPor,
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
            encabezados.map(escaparCSV).join(','),
            ...filas.map((fila) =>
                fila.map(escaparCSV).join(',')
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
            `movimientos_${fechaActual}.csv`

        document.body.appendChild(enlace)

        enlace.click()

        document.body.removeChild(enlace)

        URL.revokeObjectURL(url)

        setMensaje(t('transactions.exported', { count: movimientosFiltrados.length }))
    }

    // =========================
    // PAGINACIÓN
    // =========================

    const totalPaginas = Math.ceil(
        movimientosFiltrados.length /
        registrosPorPagina
    )

    const indiceInicial =
        (paginaActual - 1) *
        registrosPorPagina

    const movimientosPagina =
        movimientosFiltrados.slice(
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

    return (
        <div className="w-full space-y-6 font-sans text-slate-800">

            {/* NOTIFICACIONES */}

            <Notification
                tipo="success"
                mensaje={mensaje}
                onClose={() => setMensaje('')}
            />

            <Notification
                tipo="error"
                mensaje={error}
                onClose={() => setError('')}
            />

            {/* ENCABEZADO */}

            <div className="mb-6 sm:mb-8">

                <h1 className="text-2xl font-bold text-gray-800">
                    {t('nav.movimientos')}
                </h1>

                <p className="text-gray-500">
                    {t('transactions.description')}
                </p>

            </div>

            {/* FORMULARIO */}

            <section className="mb-6 w-full rounded-[14px] bg-white p-4 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:mb-8 sm:p-6">

                <h2 className="mb-5 text-xl font-semibold text-slate-900">
                    {editandoId
                        ? t('common.editar')
                        : t('common.crear')}
                </h2>

                <form onSubmit={guardarMovimiento}>

                    <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">

                        {/* TIPO */}

                        <div className="flex min-w-0 flex-col gap-2">

                            <label
                                htmlFor="tipo"
                                className="font-semibold text-gray-700"
                            >
                                {t('transactions.selectType')}
                            </label>

                            <select
                                id="tipo"
                                name="tipo"
                                value={formulario.tipo}
                                onChange={manejarCambio}
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-gray-100"
                            >
                                <option value="Ingreso">
                                    {t('transactions.incomeOrRemittance')}
                                </option>

                                <option value="Gasto">
                                    {t('nav.gastos')}
                                </option>
                            </select>

                        </div>

                        {/* CATEGORÍA */}

                        <div className="flex min-w-0 flex-col gap-2">

                            <label
                                htmlFor="idCategoria"
                                className="font-semibold text-gray-700"
                            >
                                {t('common.categoria')}
                            </label>

                            <select
                                id="idCategoria"
                                name="idCategoria"
                                value={formulario.idCategoria}
                                onChange={manejarCambio}
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-gray-100"
                            >
                                <option value="">
                                    {t('common.seleccionaCategoria')}
                                </option>

                                {categorias
                                    .filter(
                                        (categoria) =>
                                            categoria.tipo ===
                                            formulario.tipo
                                    )
                                    .map((categoria) => (
                                        <option
                                            key={categoria.idCategoria}
                                            value={categoria.idCategoria}
                                        >
                                            {categoria.nombre}
                                        </option>
                                    ))}
                            </select>

                        </div>

                        {/* MONTO */}

                        <div className="flex min-w-0 flex-col gap-2">

                            <label
                                htmlFor="monto"
                                className="font-semibold text-gray-700"
                            >
                                {t('common.monto')}
                            </label>

                            <input
                                id="monto"
                                type="number"
                                name="monto"
                                min="0"
                                step="0.01"
                                value={formulario.monto}
                                onChange={manejarCambio}
                                placeholder="0.00"
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                            />

                        </div>

                        {/* FECHA */}

                        <div className="flex min-w-0 flex-col gap-2">

                            <label
                                htmlFor="fecha"
                                className="font-semibold text-gray-700"
                            >
                                {t('common.fecha')}
                            </label>

                            <input
                                id="fecha"
                                type="date"
                                name="fecha"
                                value={formulario.fecha}
                                onChange={manejarCambio}
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-gray-100"
                            />

                        </div>

                        {/* ORIGEN */}

                        <div className="flex min-w-0 flex-col gap-2">

                            <label
                                htmlFor="origenEmisora"
                                className="font-semibold text-gray-700"
                            >
                                {t('transactions.source')}
                            </label>

                            <input
                                id="origenEmisora"
                                type="text"
                                name="origenEmisora"
                                value={formulario.origenEmisora}
                                onChange={manejarCambio}
                                placeholder={t('transactions.sourceExample')}
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                            />

                        </div>

                        {/* DESCRIPCIÓN */}

                        <div className="flex min-w-0 flex-col gap-2 md:col-span-2">

                            <label
                                htmlFor="descripcion"
                                className="font-semibold text-gray-700"
                            >
                                {t('common.descripcion')}
                            </label>

                            <input
                                id="descripcion"
                                type="text"
                                name="descripcion"
                                value={formulario.descripcion}
                                onChange={manejarCambio}
                                placeholder={t('transactions.descriptionPlaceholder')}
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                            />

                        </div>

                    </div>

                    {/* BOTONES */}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                        <button
                            type="submit"
                            disabled={procesando}
                            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:-translate-y-px hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {procesando
                                ? t('common.guardando')
                                : editandoId
                                    ? t('common.actualizar')
                                    : t('transactions.save')}
                        </button>

                        {editandoId && (
                            <button
                                type="button"
                                onClick={limpiarFormulario}
                                disabled={procesando}
                                className="w-full rounded-lg bg-gray-500 px-5 py-2.5 font-semibold text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                {t('common.cancelar')}
                            </button>
                        )}

                    </div>

                </form>

            </section>

            {/* FILTROS */}

            <section className="mb-6 w-full rounded-[14px] bg-white p-4 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:p-6">

                <div className="mb-5">

                    <h2 className="text-xl font-semibold text-slate-900">
                        {t('nav.movimientos')} / {t('common.editar')}
                    </h2>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={exportarMovimientosCSV}
                            disabled={
                                cargando ||
                                procesando ||
                                movimientosFiltrados.length === 0
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 px-4 py-2.5 font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            <Download size={17} aria-hidden="true" />
                            {t('transactions.csvFiltered')}
                        </button>
                        <button
                            onClick={() => exportarMovimientosRemotos('csv')}
                            disabled={cargando || procesando}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            <Download size={17} aria-hidden="true" />
                            CSV
                        </button>
                        <button
                            onClick={() => exportarMovimientosRemotos('json')}
                            disabled={cargando || procesando}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            <Download size={17} aria-hidden="true" />
                            JSON
                        </button>
                        <button
                            onClick={cargarDatos}
                            disabled={cargando || procesando}
                            className="w-full rounded-lg bg-gray-700 px-4 py-2.5 font-semibold text-white transition hover:-translate-y-px hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {cargando ? 'Cargando...' : 'Actualizar'}
                        </button>
                    </div>

                </div>

                <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Filtros
                            </h3>
                            <p className="text-sm text-gray-500">
                            {t('transactions.filterDescription')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="w-full rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-600 sm:w-auto"
                        >
                            {t('common.limpiarFiltros')}
                        </button>
                    </div>

                    <div className="mb-4 flex flex-col gap-2">
                        <label
                            htmlFor="busquedaMovimientos"
                            className="text-sm font-semibold text-gray-700"
                        >
                            {t('common.buscarDescripcion')}
                        </label>
                        <input
                            id="busquedaMovimientos"
                            type="text"
                            name="busqueda"
                            value={filtros.busqueda}
                            onChange={manejarCambioFiltro}
                            placeholder={t('income.searchPlaceholder')}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
                        <div className="flex min-w-0 flex-col gap-2">
                            <label htmlFor="fechaDesde" className="text-sm font-semibold text-gray-700">
                                {t('common.fechaDesde')}
                            </label>
                            <input
                                id="fechaDesde"
                                type="date"
                                name="fechaDesde"
                                value={filtros.fechaDesde}
                                onChange={manejarCambioFiltro}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                            />
                        </div>

                        <div className="flex min-w-0 flex-col gap-2">
                            <label htmlFor="fechaHasta" className="text-sm font-semibold text-gray-700">
                                {t('common.fechaHasta')}
                            </label>
                            <input
                                id="fechaHasta"
                                type="date"
                                name="fechaHasta"
                                value={filtros.fechaHasta}
                                onChange={manejarCambioFiltro}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                            />
                        </div>

                        <div className="flex min-w-0 flex-col gap-2">
                            <label htmlFor="filtroCategoriaMovimientos" className="text-sm font-semibold text-gray-700">
                                {t('common.categoria')}
                            </label>
                            <select
                                id="filtroCategoriaMovimientos"
                                name="idCategoria"
                                value={filtros.idCategoria}
                                onChange={manejarCambioFiltro}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                            >
                                <option value="">Todas</option>
                                {categorias.map((categoria) => (
                                    <option key={categoria.idCategoria} value={categoria.idCategoria}>
                                        {categoria.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex min-w-0 flex-col gap-2">
                            <label htmlFor="montoMinimo" className="text-sm font-semibold text-gray-700">
                                {t('common.montoMinimo')}
                            </label>
                            <input
                                id="montoMinimo"
                                type="number"
                                name="montoMinimo"
                                min="0"
                                step="0.01"
                                value={filtros.montoMinimo}
                                onChange={manejarCambioFiltro}
                                placeholder="0.00"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                            />
                        </div>

                        <div className="flex min-w-0 flex-col gap-2">
                            <label htmlFor="montoMaximo" className="text-sm font-semibold text-gray-700">
                                {t('common.montoMaximo')}
                            </label>
                            <input
                                id="montoMaximo"
                                type="number"
                                name="montoMaximo"
                                min="0"
                                step="0.01"
                                value={filtros.montoMaximo}
                                onChange={manejarCambioFiltro}
                                placeholder="0.00"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                            />
                        </div>

                        <div className="flex min-w-0 flex-col gap-2">
                            <label htmlFor="filtroMiembroMovimientos" className="text-sm font-semibold text-gray-700">
                                {t('transactions.member')}
                            </label>
                            <select
                                id="filtroMiembroMovimientos"
                                name="idUsuario"
                                value={filtros.idUsuario}
                                onChange={manejarCambioFiltro}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                            >
                                <option value="">{t('transactions.allMembers')}</option>
                                {miembros.map((miembro) => (
                                    <option key={miembro.idUsuario} value={miembro.idUsuario}>
                                        {nombresPorUsuario.get(miembro.idUsuario)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {cargando ? (

                    <Loading mensaje={t('common.cargando')} />

                ) : movimientos.length === 0 ? (

                    <div className="rounded-lg bg-gray-50 p-8 text-center">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                            📋
                        </div>

                        <p className="mt-4 font-medium text-gray-700">
                            {t('transactions.empty')}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            {t('transactions.emptyHint')}
                        </p>

                    </div>

                ) : movimientosFiltrados.length === 0 ? (

                    <div className="rounded-lg bg-gray-50 p-6 text-center sm:p-8">

                        <p className="text-sm font-medium text-gray-600 sm:text-base">
                            {t('transactions.emptyFiltered')}
                        </p>

                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            {t('common.limpiarFiltros')}
                        </button>

                    </div>

                ) : (

                    <>

                           <div className="w-full overflow-x-auto">

                             <table className="w-full min-w-[800px]">
                                <thead>

                                    <tr>

                                        <th className="whitespace-nowrap bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            {t('common.fecha')}
                                        </th>

                                        <th className="whitespace-nowrap bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            {t('common.tipo')}
                                        </th>

                                        <th className="whitespace-nowrap bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            {t('common.categoria')}
                                        </th>

                                        <th className="whitespace-nowrap bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            {t('common.monto')}
                                        </th>

                                        <th className="bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            {t('common.descripcion')}
                                        </th>

                                        <th className="whitespace-nowrap bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            {t('common.origen')}
                                        </th>

                                        <th className="whitespace-nowrap bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            {t('transactions.registeredBy')}
                                        </th>

                                        <th className="whitespace-nowrap bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            {t('common.acciones')}
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {movimientosPagina.map((movimiento) => {

                                        const categoria =
                                            categorias.find(
                                                (c) =>
                                                    c.idCategoria ===
                                                    movimiento.idCategoria
                                            )

                                        return (

                                            <tr
                                                key={movimiento.idMovimiento}
                                                className="transition hover:bg-gray-50"
                                            >

                                                <td className="whitespace-nowrap border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">
                                                    {formatearFecha(movimiento.fecha)}
                                                </td>

                                                <td className="whitespace-nowrap border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">

                                                    <span
                                                        className={
                                                            movimiento.tipo ===
                                                                'Ingreso'
                                                                ? 'inline-block rounded-full bg-green-100 px-2.5 py-1 text-sm font-bold text-green-700'
                                                                : movimiento.tipo ===
                                                                  'Ahorro'
                                                                    ? 'inline-block rounded-full bg-amber-100 px-2.5 py-1 text-sm font-bold text-amber-700'
                                                                    : 'inline-block rounded-full bg-red-100 px-2.5 py-1 text-sm font-bold text-red-600'
                                                        }
                                                    >
                                                        {movimiento.tipo}
                                                    </span>

                                                </td>

                                                <td className="whitespace-nowrap border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">
                                                    {categoria?.nombre ||
                                                        t('common.sinCategoria')}
                                                </td>

                                                <td className="whitespace-nowrap border-b border-gray-200 px-3 py-3.5 text-sm font-semibold sm:px-3.5">
                                                    {formatearMoneda(
                                                        movimiento.monto
                                                    )}
                                                </td>

                                                <td className="max-w-[250px] break-words border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">
                                                    {movimiento.descripcion ||
                                                        '-'}
                                                </td>

                                                <td className="max-w-[180px] break-words border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">
                                                    {movimiento.origenEmisora ||
                                                        '-'}
                                                </td>

                                                <td className="whitespace-nowrap border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">
                                                    {nombreDeUsuario(movimiento.idUsuario)}
                                                </td>

                                                <td className="border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">

                                                    <div className="flex flex-col gap-2 sm:flex-row">

                                                        <button
                                                            onClick={() =>
                                                                editarMovimiento(
                                                                    movimiento
                                                                )
                                                            }
                                                            disabled={procesando}
                                                            className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                                        >
                                                            {t('common.editar')}
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                eliminarMovimiento(
                                                                    movimiento.idMovimiento
                                                                )
                                                            }
                                                            disabled={procesando}
                                                            className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                                        >
                                                            {procesando
                                                                ? t('common.procesando')
                                                                : t('common.eliminar')}
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    })}

                                </tbody>

                            </table>

                        </div>

                        <div className="px-1 pb-1">

                            <Pagination
                                paginaActual={paginaActual}
                                totalPaginas={totalPaginas}
                                cambiarPagina={cambiarPagina}
                            />

                        </div>

                    </>

                )}

            </section>

            <ConfirmModal
                abierto={confirmModal.abierto}
                titulo={confirmModal.titulo}
                mensaje={confirmModal.mensaje}
                onConfirmar={confirmarEliminarMovimiento}
                onCancelar={() =>
                    setConfirmModal({
                        abierto: false,
                        id: null,
                        titulo: '',
                        mensaje: '',
                    })
                }
            />

        </div>
    )
}
