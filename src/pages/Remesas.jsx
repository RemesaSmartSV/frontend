import { useCallback, useEffect, useMemo, useState } from 'react'
import { categoriasApi, movimientosApi } from '../services/api'
import Notification from '../components/Notification'
import Loading from '../components/Loading'
import Pagination from '../components/Pagination'
import ConfirmModal from '../components/ConfirmModal'

export default function Remesas() {
    const [remesas, setRemesas] = useState([])
    const [categorias, setCategorias] = useState([])

    const [formulario, setFormulario] = useState({
        idCategoria: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        origenEmisora: '',
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

    // FILTROS
    const [filtros, setFiltros] = useState({
        fechaDesde: '',
        fechaHasta: '',
        idCategoria: '',
        montoMinimo: '',
        montoMaximo: '',
        busqueda: '',
    })

    // PAGINACIÓN
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

            const remesasFiltradas = movimientosData.filter(
                (movimiento) =>
                    movimiento.tipo === 'Ingreso' &&
                    movimiento.origenEmisora
            )

            setRemesas(remesasFiltradas)
            setCategorias(categoriasData)

            setPaginaActual(1)
        } catch (err) {
            setError(
                err.message ||
                'No se pudieron cargar las remesas.'
            )
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

    // CAMBIO DE FILTROS
    function manejarCambioFiltro(e) {
        const { name, value } = e.target

        setFiltros({
            ...filtros,
            [name]: value,
        })

        setPaginaActual(1)
    }

    // LIMPIAR FILTROS
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

    // APLICAR FILTROS
    const remesasFiltradas = useMemo(() => {
        return remesas.filter((remesa) => {
            // FILTRO POR CATEGORÍA
            if (
                filtros.idCategoria &&
                Number(remesa.idCategoria) !==
                Number(filtros.idCategoria)
            ) {
                return false
            }

            // FILTRO POR MONTO MÍNIMO
            if (
                filtros.montoMinimo !== '' &&
                Number(remesa.monto) <
                Number(filtros.montoMinimo)
            ) {
                return false
            }

            // FILTRO POR MONTO MÁXIMO
            if (
                filtros.montoMaximo !== '' &&
                Number(remesa.monto) >
                Number(filtros.montoMaximo)
            ) {
                return false
            }

            // FILTRO POR FECHA
            const fechaRemesa =
                remesa.fecha?.split('T')[0] || ''

            if (
                filtros.fechaDesde &&
                fechaRemesa < filtros.fechaDesde
            ) {
                return false
            }

            if (
                filtros.fechaHasta &&
                fechaRemesa > filtros.fechaHasta
            ) {
                return false
            }

            // FILTRO POR BÚSQUEDA
            if (filtros.busqueda) {
                const termino = filtros.busqueda.toLowerCase()
                const descripcion = (remesa.descripcion || '').toLowerCase()
                const origen = (remesa.origenEmisora || '').toLowerCase()
                if (!descripcion.includes(termino) && !origen.includes(termino)) {
                    return false
                }
            }

            return true
        })
    }, [remesas, filtros])

    async function guardarRemesa(e) {
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

        if (!formulario.origenEmisora.trim()) {
            setError('Indica el origen o emisora de la remesa.')
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
                tipo: 'Ingreso',
                descripcion: formulario.descripcion,
                origenEmisora: formulario.origenEmisora,
            }

            if (editandoId) {
                await movimientosApi.actualizar(
                    editandoId,
                    movimiento
                )

                setMensaje(
                    'Remesa actualizada correctamente.'
                )
            } else {
                await movimientosApi.crear(movimiento)

                setMensaje(
                    'Remesa registrada correctamente.'
                )
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (err) {
            setError(
                err.message ||
                'No se pudo guardar la remesa.'
            )
        } finally {
            setProcesando(false)
        }
    }

    function editarRemesa(remesa) {
        setEditandoId(remesa.idMovimiento)

        setFormulario({
            idCategoria: remesa.idCategoria,
            monto: remesa.monto,
            fecha: remesa.fecha?.split('T')[0] || '',
            origenEmisora: remesa.origenEmisora || '',
            descripcion: remesa.descripcion || '',
        })

        setError('')
        setMensaje('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    function eliminarRemesa(id) {
        setConfirmModal({
            abierto: true,
            id,
            titulo: 'Eliminar remesa',
            mensaje: '¿Seguro que deseas eliminar esta remesa? Esta acción no se puede deshacer.',
        })
    }

    async function confirmarEliminarRemesa() {
        const id = confirmModal.id
        setConfirmModal({ abierto: false, id: null, titulo: '', mensaje: '' })

        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            await movimientosApi.eliminar(id)

            setMensaje('Remesa eliminada correctamente.')

            await cargarDatos()
        } catch (err) {
            setError(err.message || 'No se pudo eliminar la remesa.')
        } finally {
            setProcesando(false)
        }
    }

    function limpiarFormulario() {
        setEditandoId(null)

        setFormulario({
            idCategoria: '',
            monto: '',
            fecha: new Date().toISOString().split('T')[0],
            origenEmisora: '',
            descripcion: '',
        })
    }

    function obtenerNombreCategoria(idCategoria) {
        const categoria = categorias.find(
            (c) => c.idCategoria === idCategoria
        )

        return categoria?.nombre || 'Sin categoría'
    }

    // EXPORTAR REMESAS A CSV
    function exportarRemesas() {
        if (remesasFiltradas.length === 0) {
            setError('No hay remesas para exportar.')
            return
        }

        const encabezados = [
            'Fecha',
            'Origen',
            'Categoría',
            'Monto',
            'Descripción',
        ]

        const filas = remesasFiltradas.map((remesa) => {
            const fecha =
                remesa.fecha?.split('T')[0] || ''

            const origen =
                remesa.origenEmisora || ''

            const categoria =
                obtenerNombreCategoria(
                    remesa.idCategoria
                )

            const monto =
                Number(remesa.monto).toFixed(2)

            const descripcion =
                remesa.descripcion || ''

            return [
                fecha,
                origen,
                categoria,
                monto,
                descripcion,
            ]
        })

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

        // BOM para que Excel reconozca correctamente
        // los caracteres especiales y tildes.
        const BOM = '\uFEFF'

        const archivo = new Blob(
            [BOM + contenidoCSV],
            {
                type: 'text/csv;charset=utf-8;',
            }
        )

        const url = URL.createObjectURL(archivo)

        const enlace = document.createElement('a')
        enlace.href = url

        const fechaActual =
            new Date().toISOString().split('T')[0]

        enlace.download =
            `remesas_${fechaActual}.csv`

        document.body.appendChild(enlace)
        enlace.click()
        document.body.removeChild(enlace)

        URL.revokeObjectURL(url)

        setMensaje(
            `${remesasFiltradas.length} remesa(s) exportada(s) correctamente.`
        )
    }

    // PAGINACIÓN DE RESULTADOS FILTRADOS
    const totalPaginas = Math.ceil(
        remesasFiltradas.length / registrosPorPagina
    )

    const indiceInicial =
        (paginaActual - 1) * registrosPorPagina

    const remesasPagina = remesasFiltradas.slice(
        indiceInicial,
        indiceInicial + registrosPorPagina
    )

    function cambiarPagina(nuevaPagina) {
        if (
            nuevaPagina >= 1 &&
            nuevaPagina <= totalPaginas
        ) {
            setPaginaActual(nuevaPagina)
        }
    }

    return (
        <div className="space-y-6">

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
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">

                <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Remesas
                    </h1>

                    <p className="text-gray-500">
                        Registra y administra las remesas
                        recibidas por tu hogar.
                    </p>
                </div>

                <button
                    onClick={cargarDatos}
                    disabled={cargando || procesando}
                    className="w-full rounded-lg bg-gray-700 px-4 py-2.5 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                    {cargando
                        ? 'Cargando...'
                        : 'Actualizar'}
                </button>

            </div>

            {/* FORMULARIO */}
            <section className="mb-6 overflow-hidden rounded-[14px] bg-white p-4 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:mb-8 sm:p-6">

                <h2 className="mb-5 text-xl font-semibold text-slate-900">
                    {editandoId
                        ? 'Editar remesa'
                        : 'Registrar remesa'}
                </h2>

                <form onSubmit={guardarRemesa}>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

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
                                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 disabled:bg-gray-100"
                            >
                                <option value="">
                                    Selecciona una categoría
                                </option>

                                {categorias
                                    .filter(
                                        (categoria) =>
                                            categoria.tipo ===
                                            'Ingreso'
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
                                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
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
                                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 disabled:bg-gray-100"
                            />

                        </div>

                        {/* ORIGEN / EMISORA */}
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
                                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
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
                                placeholder="Descripción de la remesa"
                                disabled={procesando}
                                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                            />

                        </div>

                    </div>

                    {/* BOTONES */}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                        <button
                            type="submit"
                            disabled={procesando}
                            className="w-full rounded-lg bg-violet-600 px-5 py-2.5 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {procesando
                                ? 'Guardando...'
                                : editandoId
                                    ? 'Actualizar remesa'
                                    : 'Guardar remesa'}
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

            {/* LISTA DE REMESAS */}
            <section className="mb-8 overflow-hidden rounded-[14px] bg-white p-4 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:p-6">

                <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold text-slate-900">
                            Remesas registradas
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Consulta y administra las remesas recibidas.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

                        {/* BOTÓN EXPORTAR */}
                        <button
                            type="button"
                            onClick={exportarRemesas}
                            disabled={
                                cargando ||
                                procesando ||
                                remesasFiltradas.length === 0
                            }
                            className="w-full rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            Exportar
                        </button>

                        {/* BOTÓN ACTUALIZAR */}
                        <button
                            onClick={cargarDatos}
                            disabled={cargando || procesando}
                            className="w-full rounded-lg bg-gray-700 px-4 py-2.5 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {cargando
                                ? 'Cargando...'
                                : 'Actualizar'}
                        </button>

                    </div>

                </div>

                {/* FILTROS */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">

                    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Filtros
                            </h3>

                            <p className="text-sm text-gray-500">
                                Filtra las remesas por fecha, categoría o monto.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="w-full rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-600 sm:w-auto"
                        >
                            Limpiar filtros
                        </button>

                    </div>

                    <div className="mb-4">
                        <label className="text-sm font-semibold text-gray-700">
                            Buscar por descripción u origen
                        </label>
                        <input
                            type="text"
                            name="busqueda"
                            value={filtros.busqueda}
                            onChange={manejarCambioFiltro}
                            placeholder="Ej. Estados Unidos, Western Union..."
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 placeholder:text-gray-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">

                        {/* FECHA DESDE */}
                        <div className="flex min-w-0 flex-col gap-2">

                            <label
                                htmlFor="fechaDesde"
                                className="text-sm font-semibold text-gray-700"
                            >
                                Fecha desde
                            </label>

                            <input
                                id="fechaDesde"
                                type="date"
                                name="fechaDesde"
                                value={filtros.fechaDesde}
                                onChange={manejarCambioFiltro}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                            />

                        </div>

                        {/* FECHA HASTA */}
                        <div className="flex min-w-0 flex-col gap-2">

                            <label
                                htmlFor="fechaHasta"
                                className="text-sm font-semibold text-gray-700"
                            >
                                Fecha hasta
                            </label>

                            <input
                                id="fechaHasta"
                                type="date"
                                name="fechaHasta"
                                value={filtros.fechaHasta}
                                onChange={manejarCambioFiltro}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                            />

                        </div>

                        {/* CATEGORÍA */}
                        <div className="flex min-w-0 flex-col gap-2">

                            <label
                                htmlFor="filtroCategoria"
                                className="text-sm font-semibold text-gray-700"
                            >
                                Categoría
                            </label>

                            <select
                                id="filtroCategoria"
                                name="idCategoria"
                                value={filtros.idCategoria}
                                onChange={manejarCambioFiltro}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                            >
                                <option value="">
                                    Todas
                                </option>

                                {categorias
                                    .filter(
                                        (categoria) =>
                                            categoria.tipo ===
                                            'Ingreso'
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

                        {/* MONTO MÍNIMO */}
                        <div className="flex min-w-0 flex-col gap-2">

                            <label
                                htmlFor="montoMinimo"
                                className="text-sm font-semibold text-gray-700"
                            >
                                Monto mínimo
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
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 placeholder:text-gray-400"
                            />

                        </div>

                        {/* MONTO MÁXIMO */}
                        <div className="flex min-w-0 flex-col gap-2">

                            <label
                                htmlFor="montoMaximo"
                                className="text-sm font-semibold text-gray-700"
                            >
                                Monto máximo
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
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 placeholder:text-gray-400"
                            />

                        </div>

                    </div>

                    {/* RESULTADOS */}
                    <p className="mt-4 text-sm text-gray-600">
                        Mostrando{' '}
                        <span className="font-semibold">
                            {remesasFiltradas.length}
                        </span>{' '}
                        de{' '}
                        <span className="font-semibold">
                            {remesas.length}
                        </span>{' '}
                        remesas.
                    </p>

                </div>

                {cargando ? (
                    <Loading mensaje="Cargando remesas..." />

                ) : remesasFiltradas.length === 0 ? (

                    <div className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                        {remesas.length === 0
                            ? 'No hay remesas registradas.'
                            : 'No hay remesas que coincidan con los filtros.'}
                    </div>

                ) : (

                    <>

                        <div className="w-full overflow-x-auto rounded-lg border border-gray-200">

                            <table className="min-w-[950px] w-full border-collapse text-left text-sm">

                                <thead>
                                    <tr>

                                        <th className="whitespace-nowrap bg-violet-50 px-3.5 py-3 font-bold text-gray-700">
                                            Fecha
                                        </th>

                                        <th className="whitespace-nowrap bg-violet-50 px-3.5 py-3 font-bold text-gray-700">
                                            Origen
                                        </th>

                                        <th className="whitespace-nowrap bg-violet-50 px-3.5 py-3 font-bold text-gray-700">
                                            Categoría
                                        </th>

                                        <th className="whitespace-nowrap bg-violet-50 px-3.5 py-3 font-bold text-gray-700">
                                            Monto
                                        </th>

                                        <th className="bg-violet-50 px-3.5 py-3 font-bold text-gray-700">
                                            Descripción
                                        </th>

                                        <th className="whitespace-nowrap bg-violet-50 px-3.5 py-3 font-bold text-gray-700">
                                            Acciones
                                        </th>

                                    </tr>
                                </thead>

                                <tbody>

                                    {remesasPagina.map((remesa) => (
                                        <tr
                                            key={
                                                remesa.idMovimiento
                                            }
                                            className="transition hover:bg-violet-50"
                                        >

                                            <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                                {new Date(
                                                    remesa.fecha
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="max-w-[180px] break-words border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                                {remesa.origenEmisora}
                                            </td>

                                            <td className="max-w-[180px] break-words border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                                {obtenerNombreCategoria(
                                                    remesa.idCategoria
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm font-bold text-violet-600">
                                                +$
                                                {Number(
                                                    remesa.monto
                                                ).toFixed(2)}
                                            </td>

                                            <td className="max-w-[250px] break-words border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                                {remesa.descripcion ||
                                                    '-'}
                                            </td>

                                            <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">

                                                <div className="flex flex-col gap-2 sm:flex-row">

                                                    <button
                                                        onClick={() =>
                                                            editarRemesa(
                                                                remesa
                                                            )
                                                        }
                                                        disabled={procesando}
                                                        className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            eliminarRemesa(
                                                                remesa.idMovimiento
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
                                    ))}

                                </tbody>

                            </table>

                        </div>

                        {/* PAGINACIÓN */}
                        <Pagination
                            paginaActual={paginaActual}
                            totalPaginas={totalPaginas}
                            cambiarPagina={cambiarPagina}
                        />

                    </>
                )}

            </section>

            <ConfirmModal
                abierto={confirmModal.abierto}
                titulo={confirmModal.titulo}
                mensaje={confirmModal.mensaje}
                onConfirmar={confirmarEliminarRemesa}
                onCancelar={() => setConfirmModal({ abierto: false, id: null, titulo: '', mensaje: '' })}
            />

        </div>
    )
}
