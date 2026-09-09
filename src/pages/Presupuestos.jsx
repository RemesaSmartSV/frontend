import { useEffect, useState } from 'react'
import { categoriasApi, presupuestosApi } from '../services/api'
import Notification from '../components/Notification'
import Loading from '../components/Loading'
import Pagination from '../components/Pagination'

export default function Presupuestos() {
    const [presupuestos, setPresupuestos] = useState([])
    const [categorias, setCategorias] = useState([])

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

            const [presupuestosData, categoriasData] =
                await Promise.all([
                    presupuestosApi.listar(),
                    categoriasApi.listar(),
                ])

            setPresupuestos(presupuestosData)
            setCategorias(categoriasData)

            // Regresar a la primera página al actualizar
            setPaginaActual(1)
        } catch (err) {
            setError(err.message)
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

    async function manejarSubmit(e) {
        e.preventDefault()

        if (
            !formulario.idCategoria ||
            !formulario.montoLimite ||
            !formulario.mesAnio
        ) {
            setError('Completa todos los campos.')
            return
        }

        if (Number(formulario.montoLimite) <= 0) {
            setError('El monto límite debe ser mayor que 0.')
            return
        }

        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            const datos = {
                idCategoria: Number(formulario.idCategoria),
                montoLimite: Number(formulario.montoLimite),
                mesAnio: `${formulario.mesAnio}-01`,
            }

            if (editando) {
                await presupuestosApi.actualizar(
                    editando,
                    datos
                )

                setMensaje(
                    'Presupuesto actualizado correctamente.'
                )
            } else {
                await presupuestosApi.crear(datos)

                setMensaje(
                    'Presupuesto creado correctamente.'
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

    function editarPresupuesto(presupuesto) {
        setEditando(presupuesto.idPresupuesto)

        setFormulario({
            idCategoria: presupuesto.idCategoria,
            montoLimite: presupuesto.montoLimite,
            mesAnio: presupuesto.mesAnio
                ? presupuesto.mesAnio.substring(0, 7)
                : '',
        })

        setError('')
        setMensaje('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    async function eliminarPresupuesto(id) {
        const confirmar = window.confirm(
            '¿Estás segura de que deseas eliminar este presupuesto?'
        )

        if (!confirmar) {
            return
        }

        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            await presupuestosApi.eliminar(id)

            setMensaje(
                'Presupuesto eliminado correctamente.'
            )

            await cargarDatos()
        } catch (err) {
            setError(err.message)
        } finally {
            setProcesando(false)
        }
    }

    function limpiarFormulario() {
        setFormulario({
            idCategoria: '',
            montoLimite: '',
            mesAnio: '',
        })

        setEditando(null)
    }

    function obtenerNombreCategoria(idCategoria) {
        const categoria = categorias.find(
            (cat) => cat.idCategoria === idCategoria
        )

        return categoria
            ? categoria.nombre
            : 'Sin categoría'
    }

    // DATOS DE PAGINACIÓN
    const totalPaginas = Math.ceil(
        presupuestos.length / registrosPorPagina
    )

    const indiceInicial =
        (paginaActual - 1) * registrosPorPagina

    const presupuestosPagina = presupuestos.slice(
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
                        Presupuestos
                    </h1>

                    <p className="text-sm text-gray-500 sm:text-base">
                        Administra los límites de gasto de tu hogar.
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

                <h2 className="mb-5 text-xl font-semibold text-slate-900 sm:mb-6">
                    {editando
                        ? 'Editar presupuesto'
                        : 'Crear presupuesto'}
                </h2>

                <form
                    onSubmit={manejarSubmit}
                    className="grid grid-cols-1 gap-5 md:grid-cols-3"
                >

                    {/* CATEGORÍA */}
                    <div className="min-w-0">
                        <label
                            htmlFor="idCategoria"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Categoría
                        </label>

                        <select
                            id="idCategoria"
                            name="idCategoria"
                            value={formulario.idCategoria}
                            onChange={manejarCambio}
                            disabled={procesando}
                            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
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
                    <div className="min-w-0">
                        <label
                            htmlFor="montoLimite"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Monto límite
                        </label>

                        <input
                            id="montoLimite"
                            name="montoLimite"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formulario.montoLimite}
                            onChange={manejarCambio}
                            placeholder="Ej. 500.00"
                            disabled={procesando}
                            className="w-full min-w-0 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                        />
                    </div>

                    {/* MES */}
                    <div className="min-w-0">
                        <label
                            htmlFor="mesAnio"
                            className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Mes
                        </label>

                        <input
                            id="mesAnio"
                            name="mesAnio"
                            type="month"
                            value={formulario.mesAnio}
                            onChange={manejarCambio}
                            disabled={procesando}
                            className="w-full min-w-0 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                        />
                    </div>

                    {/* BOTONES */}
                    <div className="flex flex-col gap-3 md:col-span-3 sm:flex-row">

                        <button
                            type="submit"
                            disabled={procesando}
                            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {procesando
                                ? 'Guardando...'
                                : editando
                                    ? 'Actualizar presupuesto'
                                    : 'Guardar presupuesto'}
                        </button>

                        {editando && (
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

            {/* TABLA */}
            <section className="mb-8 overflow-hidden rounded-[14px] bg-white p-4 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:p-6">

                <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold text-slate-900">
                            Mis presupuestos
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Consulta y administra tus presupuestos registrados.
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

                {cargando ? (
                    <Loading mensaje="Cargando presupuestos..." />

                ) : presupuestos.length === 0 ? (

                    <div className="rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                        No tienes presupuestos registrados.
                    </div>

                ) : (

                    <>
                        <div className="w-full overflow-x-auto rounded-lg border border-gray-200">

                            <table className="min-w-[700px] w-full border-collapse text-left text-sm">

                                <thead>
                                    <tr>
                                        <th className="whitespace-nowrap border-b bg-gray-50 px-4 py-3 font-semibold text-gray-700">
                                            Categoría
                                        </th>

                                        <th className="whitespace-nowrap border-b bg-gray-50 px-4 py-3 font-semibold text-gray-700">
                                            Mes
                                        </th>

                                        <th className="whitespace-nowrap border-b bg-gray-50 px-4 py-3 font-semibold text-gray-700">
                                            Monto límite
                                        </th>

                                        <th className="whitespace-nowrap border-b bg-gray-50 px-4 py-3 text-center font-semibold text-gray-700">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {presupuestosPagina.map((presupuesto) => (
                                        <tr
                                            key={presupuesto.idPresupuesto}
                                            className="transition hover:bg-gray-50"
                                        >

                                            <td className="max-w-[220px] break-words border-b border-gray-200 px-4 py-3 text-gray-700">
                                                {obtenerNombreCategoria(
                                                    presupuesto.idCategoria
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-gray-700">
                                                {presupuesto.mesAnio
                                                    ? presupuesto.mesAnio.substring(
                                                        0,
                                                        7
                                                    )
                                                    : ''}
                                            </td>

                                            <td className="whitespace-nowrap border-b border-gray-200 px-4 py-3 font-semibold text-gray-800">
                                                $
                                                {Number(
                                                    presupuesto.montoLimite
                                                ).toFixed(2)}
                                            </td>

                                            <td className="border-b border-gray-200 px-4 py-3">

                                                <div className="flex flex-col justify-center gap-2 sm:flex-row">

                                                    <button
                                                        onClick={() =>
                                                            editarPresupuesto(
                                                                presupuesto
                                                            )
                                                        }
                                                        disabled={procesando}
                                                        className="w-full rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            eliminarPresupuesto(
                                                                presupuesto.idPresupuesto
                                                            )
                                                        }
                                                        disabled={procesando}
                                                        className="w-full rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

        </main>
    )
}