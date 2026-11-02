import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { categoriasApi, movimientosApi, usuariosApi } from '../services/api'
import Notification from '../components/Notification'
import Loading from '../components/Loading'
import Pagination from '../components/Pagination'
import ConfirmModal from '../components/ConfirmModal'
import FiltrosMenu from '../components/FiltrosMenu'
import { formatearMoneda, formatearFecha, obtenerFechaHoy } from '../utils/formato'
import {
    ClipboardList,
    Download,
    Filter,
    Pencil,
    Plus,
    SearchX,
} from 'lucide-react'
import { EncabezadoSeccion } from '../components/ui/EncabezadoSeccion'
import { EstadoVacio } from '../components/ui/EstadoVacio'
import { TONOS } from '../components/ui/ChipIcono'
import { CLASE_TARJETA, CLASE_TH } from '../components/ui/estilos'

/*
 * ==========================================
 * T12 — vista por tarjetas (pantallas chicas)
 * ==========================================
 * La página existe en DOS representaciones: la tabla (≥640px) y la lista de
 * tarjetas (<640px). Ambas se montan en el DOM y se alternan con
 * `hidden sm:block` / `sm:hidden`, así que cualquier texto repetido hay que
 * buscarlo acotado a la tabla o a la lista (`within(...)`), nunca contra la
 * pantalla completa.
 *
 * El estilo por tipo se centraliza aquí para que tabla y tarjetas no puedan
 * desincronizarse (badge + color del monto).
 */
function estiloPorTipo(tipo) {
    if (tipo === 'Ingreso') {
        return {
            badge: `inline-block rounded-full ${TONOS.verde} px-2.5 py-1 text-sm font-bold`,
            monto: 'text-green-600',
        }
    }

    if (tipo === 'Ahorro') {
        return {
            badge: `inline-block rounded-full ${TONOS.ambar} px-2.5 py-1 text-sm font-bold`,
            monto: 'text-amber-600',
        }
    }

    return {
        badge: `inline-block rounded-full ${TONOS.rojo} px-2.5 py-1 text-sm font-bold`,
        monto: 'text-red-600',
    }
}

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

    // Badge del botón "Filtros": todos los criterios con valor, INCLUIDA la
    // búsqueda (también estrecha la lista aunque viva fuera del panel, así
    // que contarla es lo honesto con lo que el usuario ve filtrado).
    const cantidadFiltrosActivos = useMemo(
        () =>
            Object.values(filtros).filter(
                (valor) => String(valor ?? '').trim() !== ''
            ).length,
        [filtros]
    )

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

    // Orden de preferencia del nombre del autor: nombreAutor del backend
    // (resuelto en el servidor, cubre también a miembros removidos de la
    // familia) → join con los miembros actuales → "Desconocido".
    function nombreDeUsuario(movimiento) {
        return (
            movimiento.nombreAutor ||
            nombresPorUsuario.get(movimiento.idUsuario) ||
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
                    nombreDeUsuario(movimiento)

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

                <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                    {t('nav.movimientos')}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    {t('transactions.description')}
                </p>

            </div>

            {/* FORMULARIO */}

            <section className={`${CLASE_TARJETA} mb-6 sm:mb-8`}>

                <EncabezadoSeccion
                    Icono={editandoId ? Pencil : Plus}
                    tono={editandoId ? 'ambar' : 'azul'}
                    titulo={
                        editandoId
                            ? t('common.editar')
                            : t('common.crear')
                    }
                />

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
                                className="input"
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
                                className="input"
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
                                className="input"
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
                                className="input"
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
                                className="input"
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
                                className="input"
                            />

                        </div>

                    </div>

                    {/* BOTONES */}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                        <button
                            type="submit"
                            disabled={procesando}
                            className="w-full rounded-lg bg-[#123B8F] px-5 py-3 font-semibold text-white transition hover:-translate-y-px hover:bg-[#0B2E6B] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5"
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
                                className="w-full rounded-lg bg-slate-100 px-5 py-3 font-semibold text-slate-700 transition hover:-translate-y-px hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5"
                            >
                                {t('common.cancelar')}
                            </button>
                        )}

                    </div>

                </form>

            </section>

            {/* FILTROS */}

            <section className={`${CLASE_TARJETA} mb-6`}>

                {/* Acciones de la vista: viven en el slot `extra` del
                    encabezado para dejar el botón "Filtros" al FINAL de la
                    fila de filtros (borde derecho de la card), que es lo que
                    necesita el anclaje `right-0` del panel flotante. */}
                <EncabezadoSeccion
                    Icono={Filter}
                    tono="azul"
                    titulo={t('transactions.filtersTitle')}
                    subtitulo={t('transactions.filterDescription')}
                    extra={
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <button
                                type="button"
                                onClick={exportarMovimientosCSV}
                                disabled={
                                    cargando ||
                                    procesando ||
                                    movimientosFiltrados.length === 0
                                }
                                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${TONOS.verde} hover:bg-green-200`}
                            >
                                <Download size={17} aria-hidden="true" />
                                {t('transactions.csvFiltered')}
                            </button>
                            <button
                                onClick={() => exportarMovimientosRemotos('csv')}
                                disabled={cargando || procesando}
                                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${TONOS.azul} hover:bg-blue-200`}
                            >
                                <Download size={17} aria-hidden="true" />
                                {t('transactions.csv')}
                            </button>
                            <button
                                onClick={() => exportarMovimientosRemotos('json')}
                                disabled={cargando || procesando}
                                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${TONOS.azul} hover:bg-blue-200`}
                            >
                                <Download size={17} aria-hidden="true" />
                                {t('transactions.json')}
                            </button>
                            <button
                                onClick={cargarDatos}
                                disabled={cargando || procesando}
                                className={`w-full rounded-lg px-4 py-2.5 font-semibold transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${TONOS.azul} hover:bg-blue-200`}
                            >
                                {cargando ? t('common.cargando') : t('common.actualizar')}
                            </button>
                        </div>
                    }
                />

                {/* T1/T2 — fila superior: la búsqueda queda SIEMPRE visible
                    (es el control de mayor uso); los otros seis controles
                    viven detrás del botón "Filtros" pero siguen montados en
                    el DOM: el panel sólo los oculta con la clase `hidden`,
                    nunca con render condicional, así conservan sus
                    id/name/label htmlFor y los tests que buscan por id. */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
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
                            className="input py-2.5 text-sm"
                        />
                    </div>

                    <FiltrosMenu
                        cantidadActivos={cantidadFiltrosActivos}
                        onLimpiar={limpiarFiltros}
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                    className="input py-2.5 text-sm"
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
                                    className="input py-2.5 text-sm"
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
                                    className="input py-2.5 text-sm"
                                >
                                    <option value="">{t('transactions.allCategories')}</option>
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
                                    className="input py-2.5 text-sm"
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
                                    className="input py-2.5 text-sm"
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
                                    className="input py-2.5 text-sm"
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
                    </FiltrosMenu>

                </div>

                {cargando ? (

                    <Loading mensaje={t('common.cargando')} />

                ) : movimientos.length === 0 ? (

                    <EstadoVacio
                        Icono={ClipboardList}
                        texto={`${t('transactions.empty')} ${t('transactions.emptyHint')}`}
                        className="py-8"
                    />

                ) : movimientosFiltrados.length === 0 ? (

                    <div className="text-center">
                        <EstadoVacio
                            Icono={SearchX}
                            texto={t('transactions.emptyFiltered')}
                            className="py-8"
                        />

                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="mt-4 rounded-lg bg-[#123B8F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0B2E6B]"
                        >
                            {t('common.limpiarFiltros')}
                        </button>
                    </div>

                ) : (

                    <>

                        {/* T12: en pantallas chicas la tabla se sustituye
                            por la lista de tarjetas de más abajo. */}
                        <div className="hidden w-full overflow-x-auto sm:block">

                             <table className="w-full min-w-[800px]">
                                <thead>

                                    <tr>

                                        <th className={`${CLASE_TH} whitespace-nowrap px-3 py-3 sm:px-3.5`}>
                                            {t('common.fecha')}
                                        </th>

                                        <th className={`${CLASE_TH} whitespace-nowrap px-3 py-3 sm:px-3.5`}>
                                            {t('common.tipo')}
                                        </th>

                                        <th className={`${CLASE_TH} whitespace-nowrap px-3 py-3 sm:px-3.5`}>
                                            {t('common.categoria')}
                                        </th>

                                        <th className={`${CLASE_TH} whitespace-nowrap px-3 py-3 sm:px-3.5`}>
                                            {t('common.monto')}
                                        </th>

                                        <th className={`${CLASE_TH} px-3 py-3 sm:px-3.5`}>
                                            {t('common.descripcion')}
                                        </th>

                                        <th className={`${CLASE_TH} whitespace-nowrap px-3 py-3 sm:px-3.5`}>
                                            {t('common.origen')}
                                        </th>

                                        <th className={`${CLASE_TH} whitespace-nowrap px-3 py-3 sm:px-3.5`}>
                                            {t('transactions.registeredBy')}
                                        </th>

                                        <th className={`${CLASE_TH} whitespace-nowrap px-3 py-3 sm:px-3.5`}>
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
                                                className="transition hover:bg-slate-50"
                                            >

                                                <td className="whitespace-nowrap border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">
                                                    {formatearFecha(movimiento.fecha)}
                                                </td>

                                                <td className="whitespace-nowrap border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">

                                                    <span
                                                        className={
                                                            estiloPorTipo(
                                                                movimiento.tipo
                                                            ).badge
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
                                                    {nombreDeUsuario(movimiento)}
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
                                                            className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${TONOS.ambar} hover:bg-yellow-200`}
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
                                                            className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${TONOS.rojo} hover:bg-red-200`}
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

                        {/* T12: la misma página en pantallas chicas. Cada fila
                            de la tabla es una tarjeta con la misma información
                            y las mismas acciones. */}
                        <ul
                            aria-label={t('nav.movimientos')}
                            className="grid gap-3 sm:hidden"
                        >
                            {movimientosPagina.map((movimiento) => {
                                const categoria = categorias.find(
                                    (c) =>
                                        c.idCategoria ===
                                        movimiento.idCategoria
                                )
                                const estilo = estiloPorTipo(movimiento.tipo)

                                return (
                                    <li
                                        key={movimiento.idMovimiento}
                                        className={CLASE_TARJETA}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="break-words text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {movimiento.descripcion ||
                                                        '-'}
                                                </p>

                                                {/* Cada dato en su propio
                                                    nodo: así `getByText`
                                                    puede apuntarlo desde los
                                                    tests sin acotar regex. */}
                                                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                    <span>
                                                        {categoria?.nombre ||
                                                            t(
                                                                'common.sinCategoria'
                                                            )}
                                                    </span>

                                                    <span aria-hidden="true">
                                                        ·
                                                    </span>

                                                    <span>
                                                        {formatearFecha(
                                                            movimiento.fecha
                                                        )}
                                                    </span>
                                                </p>
                                            </div>

                                            <span className={estilo.badge}>
                                                {movimiento.tipo}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                            <span
                                                className={`text-base font-bold ${estilo.monto}`}
                                            >
                                                {formatearMoneda(
                                                    movimiento.monto
                                                )}
                                            </span>

                                            <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                <span>
                                                    {nombreDeUsuario(
                                                        movimiento
                                                    )}
                                                </span>

                                                {movimiento.origenEmisora && (
                                                    <>
                                                        <span aria-hidden="true">
                                                            ·
                                                        </span>

                                                        <span>
                                                            {
                                                                movimiento.origenEmisora
                                                            }
                                                        </span>
                                                    </>
                                                )}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                                            <button
                                                onClick={() =>
                                                    editarMovimiento(
                                                        movimiento
                                                    )
                                                }
                                                disabled={procesando}
                                                className={`flex-1 rounded-lg px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${TONOS.ambar} hover:bg-yellow-200`}
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
                                                className={`flex-1 rounded-lg px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${TONOS.rojo} hover:bg-red-200`}
                                            >
                                                {procesando
                                                    ? t('common.procesando')
                                                    : t('common.eliminar')}
                                            </button>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>

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
