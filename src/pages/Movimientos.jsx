import { useCallback, useEffect, useMemo, useState } from 'react'
import { categoriasApi, movimientosApi } from '../services/api'
import Notification from '../components/Notification'
import Loading from '../components/Loading'
import Pagination from '../components/Pagination'
import ConfirmModal from '../components/ConfirmModal'
import { formatearMoneda, obtenerFechaHoy } from '../utils/formato'
import { Download } from 'lucide-react'

export default function Movimientos() {
    const [movimientos, setMovimientos] = useState([])
    const [categorias, setCategorias] = useState([])

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

            const [movimientosData, categoriasData] =
                await Promise.all([
                    movimientosApi.listar(),
                    categoriasApi.listar(),
                ])

            setMovimientos(movimientosData)
            setCategorias(categoriasData)
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
            setError('Selecciona una categoría.')
            return
        }

        if (!formulario.monto || Number(formulario.monto) <= 0) {
            setError('El monto debe ser mayor que 0.')
            return
        }

        if (!formulario.fecha) {
            setError('Selecciona una fecha.')
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
                    'Movimiento actualizado correctamente.'
                )
            } else {
                await movimientosApi.crear(movimiento)

                setMensaje(
                    'Movimiento registrado correctamente.'
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
            titulo: 'Eliminar movimiento',
            mensaje:
                '¿Seguro que deseas eliminar este movimiento? Esta acción no se puede deshacer.',
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
                'Movimiento eliminado correctamente.'
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
            montoMinimo: '',
            montoMaximo: '',
            busqueda: '',
        })

        setPaginaActual(1)
    }

    // =========================
    // FILTRADO
    // =========================

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
            setError('No hay movimientos para exportar.')
            return
        }

        const encabezados = [
            'Fecha',
            'Tipo',
            'Categoría',
            'Monto',
            'Descripción',
            'Origen',
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
                    'Sin categoría'

                const monto =
                    Number(movimiento.monto).toFixed(2)

                const descripcion =
                    movimiento.descripcion || ''

                const origen =
                    movimiento.origenEmisora || ''

                return [
                    fecha,
                    tipo,
                    nombreCategoria,
                    monto,
                    descripcion,
                    origen,
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

        const fechaActual =
            new Date()
                .toISOString()
                .split('T')[0]

        enlace.download =
            `movimientos_${fechaActual}.csv`

        document.body.appendChild(enlace)

        enlace.click()

        document.body.removeChild(enlace)

        URL.revokeObjectURL(url)

        setMensaje(
            `${movimientosFiltrados.length} movimiento(s) exportado(s) correctamente.`
        )
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
                    Movimientos financieros
                </h1>

                <p className="text-gray-500">
                    Registra tus ingresos, remesas y gastos familiares.
                </p>

            </div>

            {/* FORMULARIO */}

            <section className="mb-6 w-full rounded-[14px] bg-white p-4 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:mb-8 sm:p-6">

                <h2 className="mb-5 text-xl font-semibold text-slate-900">
                    {editandoId
                        ? 'Editar movimiento'
                        : 'Registrar movimiento'}
                </h2>

                <form onSubmit={guardarMovimiento}>

                    <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">

                        {/* TIPO */}

                        <div className="flex min-w-0 flex-col gap-2">

                            <label
                                htmlFor="tipo"
                                className="font-semibold text-gray-700"
                            >
                                Tipo
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
                                    Ingreso / Remesa
                                </option>

                                <option value="Gasto">
                                    Gasto
                                </option>
                            </select>

                        </div>

                        {/* CATEGORÍA */}

                        <div className="flex min-w-0 flex-col gap-2">

                            <label
                                htmlFor="idCategoria"
                                className="font-semibold text-gray-700"
                            >
                                Categoría
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
                                    Selecciona una categoría
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
                                Monto
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
                                Fecha
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
                                Origen / Emisora
                            </label>

                            <input
                                id="origenEmisora"
                                type="text"
                                name="origenEmisora"
                                value={formulario.origenEmisora}
                                onChange={manejarCambio}
                                placeholder="Ej. Estados Unidos"
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
                                Descripción
                            </label>

                            <input
                                id="descripcion"
                                type="text"
                                name="descripcion"
                                value={formulario.descripcion}
                                onChange={manejarCambio}
                                placeholder="Descripción del movimiento"
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
                                ? 'Guardando...'
                                : editandoId
                                    ? 'Actualizar'
                                    : 'Guardar'}
                        </button>

                        {editandoId && (
                            <button
                                type="button"
                                onClick={limpiarFormulario}
                                disabled={procesando}
                                className="w-full rounded-lg bg-gray-500 px-5 py-2.5 font-semibold text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                Cancelar
                            </button>
                        )}

                    </div>

                </form>

            </section>

            {/* FILTROS */}

            <section className="mb-6 w-full rounded-[14px] bg-white p-4 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:p-6">

                <div className="mb-5">

                    <h2 className="text-xl font-semibold text-slate-900">
                        Filtrar movimientos
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
                            CSV filtrado
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

                {cargando ? (

                    <Loading mensaje="Cargando movimientos..." />

                ) : movimientos.length === 0 ? (

                    <div className="rounded-lg bg-gray-50 p-8 text-center">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                            📋
                        </div>

                        <p className="mt-4 font-medium text-gray-700">
                            No hay movimientos registrados.
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Usa el formulario de arriba para registrar tu primer movimiento.
                        </p>

                    </div>

                ) : movimientosFiltrados.length === 0 ? (

                    <div className="rounded-lg bg-gray-50 p-6 text-center sm:p-8">

                        <p className="text-sm font-medium text-gray-600 sm:text-base">
                            No hay movimientos que coincidan con los filtros.
                        </p>

                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            Limpiar filtros
                        </button>

                    </div>

                ) : (

                    <>

                           <div className="w-full overflow-x-auto">

                             <table className="w-full min-w-[800px]">
                                <thead>

                                    <tr>

                                        <th className="whitespace-nowrap bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            Fecha
                                        </th>

                                        <th className="whitespace-nowrap bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            Tipo
                                        </th>

                                        <th className="whitespace-nowrap bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            Categoría
                                        </th>

                                        <th className="whitespace-nowrap bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            Monto
                                        </th>

                                        <th className="bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            Descripción
                                        </th>

                                        <th className="whitespace-nowrap bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            Origen
                                        </th>

                                        <th className="whitespace-nowrap bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                            Acciones
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
                                                    {new Date(
                                                        movimiento.fecha
                                                    ).toLocaleDateString()}
                                                </td>

                                                <td className="whitespace-nowrap border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">

                                                    <span
                                                        className={
                                                            movimiento.tipo ===
                                                                'Ingreso'
                                                                ? 'inline-block rounded-full bg-green-100 px-2.5 py-1 text-sm font-bold text-green-700'
                                                                : 'inline-block rounded-full bg-red-100 px-2.5 py-1 text-sm font-bold text-red-600'
                                                        }
                                                    >
                                                        {movimiento.tipo}
                                                    </span>

                                                </td>

                                                <td className="whitespace-nowrap border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">
                                                    {categoria?.nombre ||
                                                        'Sin categoría'}
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
                                                            Editar
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
                                                                ? 'Procesando...'
                                                                : 'Eliminar'}
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
