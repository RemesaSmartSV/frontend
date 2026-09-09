import { useEffect, useState } from 'react'
import { categoriasApi, movimientosApi } from '../services/api'
import Notification from '../components/Notification'
import Loading from '../components/Loading'
import Pagination from '../components/Pagination'

export default function Gastos() {
    const [gastos, setGastos] = useState([])
    const [categorias, setCategorias] = useState([])

    const [formulario, setFormulario] = useState({
        idCategoria: '',
        monto: '',
        fecha: '',
        descripcion: '',
    })

    const [editandoId, setEditandoId] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [procesando, setProcesando] = useState(false)

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    // PAGINACIÓN
    const [paginaActual, setPaginaActual] = useState(1)
    const registrosPorPagina = 5

    useEffect(() => {
        cargarDatos()
    }, [])

    async function cargarDatos() {
        try {
            setCargando(true)
            setError('')

            const [movimientosData, categoriasData] =
                await Promise.all([
                    movimientosApi.listar(),
                    categoriasApi.listar(),
                ])

            const gastosFiltrados = movimientosData.filter(
                (movimiento) => movimiento.tipo === 'Gasto'
            )

            setGastos(gastosFiltrados)
            setCategorias(categoriasData)

            // Volver a la primera página al actualizar
            setPaginaActual(1)

        } catch (err) {
            setError(
                err.message ||
                'No se pudieron cargar los gastos.'
            )
        } finally {
            setCargando(false)
        }
    }

    function manejarCambio(e) {
        const { name, value } = e.target

        setFormulario({
            ...formulario,
            [name]: value,
        })
    }

    async function guardarGasto(e) {
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
                tipo: 'Gasto',
                descripcion: formulario.descripcion,
                origenEmisora: '',
            }

            if (editandoId) {
                await movimientosApi.actualizar(
                    editandoId,
                    movimiento
                )

                setMensaje(
                    'Gasto actualizado correctamente.'
                )
            } else {
                await movimientosApi.crear(movimiento)

                setMensaje(
                    'Gasto registrado correctamente.'
                )
            }

            limpiarFormulario()

            // Después de guardar, mostrar la primera página
            setPaginaActual(1)

            await cargarDatos()

        } catch (err) {
            setError(
                err.message ||
                'No se pudo guardar el gasto.'
            )
        } finally {
            setProcesando(false)
        }
    }

    function editarGasto(gasto) {
        setEditandoId(gasto.idMovimiento)

        setFormulario({
            idCategoria: gasto.idCategoria,
            monto: gasto.monto,
            fecha: gasto.fecha?.split('T')[0] || '',
            descripcion: gasto.descripcion || '',
        })

        setError('')
        setMensaje('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    async function eliminarGasto(id) {
        const confirmar = window.confirm(
            '¿Seguro que deseas eliminar este gasto?'
        )

        if (!confirmar) {
            return
        }

        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            await movimientosApi.eliminar(id)

            setMensaje(
                'Gasto eliminado correctamente.'
            )

            await cargarDatos()

        } catch (err) {
            setError(
                err.message ||
                'No se pudo eliminar el gasto.'
            )
        } finally {
            setProcesando(false)
        }
    }

    function limpiarFormulario() {
        setEditandoId(null)

        setFormulario({
            idCategoria: '',
            monto: '',
            fecha: '',
            descripcion: '',
        })
    }

    function obtenerNombreCategoria(idCategoria) {
        const categoria = categorias.find(
            (c) => c.idCategoria === idCategoria
        )

        return categoria?.nombre || 'Sin categoría'
    }

    // CÁLCULOS DE PAGINACIÓN
    const totalPaginas = Math.ceil(
        gastos.length / registrosPorPagina
    )

    const indiceInicial =
        (paginaActual - 1) * registrosPorPagina

    const gastosPagina = gastos.slice(
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
        <main className="mx-auto w-full max-w-5xl p-4 font-sans text-slate-800 sm:p-6 lg:p-8">

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

                    <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">
                        Gastos
                    </h1>

                    <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
                        Registra y administra los gastos realizados por tu hogar.
                    </p>

                </div>

                <button
                    onClick={cargarDatos}
                    disabled={cargando || procesando}
                    className="w-full rounded-lg bg-gray-700 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5"
                >
                    {cargando
                        ? 'Cargando...'
                        : 'Actualizar'}
                </button>

            </div>

            {/* FORMULARIO */}
            <section className="mb-6 rounded-[14px] bg-white p-5 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:mb-8 sm:p-6">

                <h2 className="mb-5 text-lg font-semibold text-slate-900 sm:text-xl">
                    {editandoId
                        ? 'Editar gasto'
                        : 'Registrar gasto'}
                </h2>

                <form onSubmit={guardarGasto}>

                    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">

                        {/* CATEGORÍA */}
                        <div className="flex flex-col gap-2">

                            <label className="text-sm font-semibold text-gray-700 sm:text-base">
                                Categoría
                            </label>

                            <select
                                name="idCategoria"
                                value={formulario.idCategoria}
                                onChange={manejarCambio}
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-600/10 disabled:bg-gray-100"
                            >
                                <option value="">
                                    Selecciona una categoría
                                </option>

                                {categorias
                                    .filter(
                                        (categoria) =>
                                            categoria.tipo === 'Gasto'
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
                        <div className="flex flex-col gap-2">

                            <label className="text-sm font-semibold text-gray-700 sm:text-base">
                                Monto
                            </label>

                            <input
                                type="number"
                                name="monto"
                                min="0"
                                step="0.01"
                                value={formulario.monto}
                                onChange={manejarCambio}
                                placeholder="0.00"
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                            />

                        </div>

                        {/* FECHA */}
                        <div className="flex flex-col gap-2">

                            <label className="text-sm font-semibold text-gray-700 sm:text-base">
                                Fecha
                            </label>

                            <input
                                type="date"
                                name="fecha"
                                value={formulario.fecha}
                                onChange={manejarCambio}
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-600/10 disabled:bg-gray-100"
                            />

                        </div>

                        {/* DESCRIPCIÓN */}
                        <div className="flex flex-col gap-2 md:col-span-2">

                            <label className="text-sm font-semibold text-gray-700 sm:text-base">
                                Descripción
                            </label>

                            <input
                                type="text"
                                name="descripcion"
                                value={formulario.descripcion}
                                onChange={manejarCambio}
                                placeholder="Ej. Compra de alimentos"
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                            />

                        </div>

                    </div>

                    {/* BOTONES */}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                        <button
                            type="submit"
                            disabled={procesando}
                            className="w-full rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:-translate-y-px hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5"
                        >
                            {procesando
                                ? 'Guardando...'
                                : editandoId
                                    ? 'Actualizar gasto'
                                    : 'Guardar gasto'}
                        </button>

                        {editandoId && (
                            <button
                                type="button"
                                className="w-full rounded-lg bg-gray-500 px-5 py-3 font-semibold text-white transition hover:-translate-y-px hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5"
                                onClick={limpiarFormulario}
                                disabled={procesando}
                            >
                                Cancelar
                            </button>
                        )}

                    </div>

                </form>

            </section>

            {/* LISTA DE GASTOS */}
            <section className="mb-6 overflow-hidden rounded-[14px] bg-white shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:mb-8">

                <div className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">

                    <div>

                        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                            Gastos registrados
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {gastos.length} gasto
                            {gastos.length !== 1 ? 's' : ''} registrado
                            {gastos.length !== 1 ? 's' : ''}
                        </p>

                    </div>

                    <button
                        onClick={cargarDatos}
                        disabled={cargando || procesando}
                        className="w-full rounded-lg bg-gray-700 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5"
                    >
                        {cargando
                            ? 'Cargando...'
                            : 'Actualizar'}
                    </button>

                </div>

                {cargando ? (

                    <div className="px-5 pb-6 sm:px-6">
                        <Loading mensaje="Cargando gastos..." />
                    </div>

                ) : gastos.length === 0 ? (

                    <div className="px-5 pb-8 pt-2 text-center sm:px-6">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                            💸
                        </div>

                        <p className="mt-4 font-medium text-gray-700">
                            No hay gastos registrados.
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Los gastos que registres aparecerán aquí.
                        </p>

                    </div>

                ) : (

                    <>

                        <div className="w-full overflow-x-auto">

                            <table className="w-full min-w-[700px] border-collapse">

                                <thead>

                                    <tr>

                                        <th className="whitespace-nowrap bg-gray-50 px-3.5 py-3 text-left text-sm font-bold text-gray-700">
                                            Fecha
                                        </th>

                                        <th className="whitespace-nowrap bg-gray-50 px-3.5 py-3 text-left text-sm font-bold text-gray-700">
                                            Categoría
                                        </th>

                                        <th className="whitespace-nowrap bg-gray-50 px-3.5 py-3 text-left text-sm font-bold text-gray-700">
                                            Monto
                                        </th>

                                        <th className="bg-gray-50 px-3.5 py-3 text-left text-sm font-bold text-gray-700">
                                            Descripción
                                        </th>

                                        <th className="whitespace-nowrap bg-gray-50 px-3.5 py-3 text-left text-sm font-bold text-gray-700">
                                            Acciones
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {gastosPagina.map((gasto) => (

                                        <tr
                                            key={gasto.idMovimiento}
                                            className="transition hover:bg-red-50"
                                        >

                                            <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                                {new Date(
                                                    gasto.fecha
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                                {obtenerNombreCategoria(
                                                    gasto.idCategoria
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm font-bold text-red-600">
                                                -$
                                                {Number(
                                                    gasto.monto
                                                ).toFixed(2)}
                                            </td>

                                            <td className="max-w-[250px] break-words border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                                {gasto.descripcion || '-'}
                                            </td>

                                            <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">

                                                <div className="flex flex-col gap-2 sm:flex-row">

                                                    <button
                                                        onClick={() =>
                                                            editarGasto(gasto)
                                                        }
                                                        disabled={procesando}
                                                        className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            eliminarGasto(
                                                                gasto.idMovimiento
                                                            )
                                                        }
                                                        disabled={procesando}
                                                        className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
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
                        <div className="px-5 pb-6 sm:px-6">

                            <Pagination
                                paginaActual={paginaActual}
                                totalPaginas={totalPaginas}
                                cambiarPagina={cambiarPagina}
                            />

                        </div>

                    </>

                )}

            </section>

        </main>
    )
}