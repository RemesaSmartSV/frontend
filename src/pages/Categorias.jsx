import { useCallback, useEffect, useState } from 'react'
import { categoriasApi } from '../services/api'
import Notification from '../components/Notification'
import Loading from '../components/Loading'
import ConfirmModal from '../components/ConfirmModal'

export default function Categorias() {
    const [categorias, setCategorias] = useState([])
    const [nombre, setNombre] = useState('')
    const [tipo, setTipo] = useState('Gasto')
    const [icono, setIcono] = useState('')

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

    const cargarCategorias = useCallback(async () => {
        try {
            setCargando(true)
            setError('')

            const data = await categoriasApi.listar()
            setCategorias(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        cargarCategorias()
    }, [cargarCategorias])

    async function guardarCategoria(e) {
        e.preventDefault()

        if (!nombre.trim()) {
            setError('Escribe el nombre de la categoría.')
            return
        }

        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            const categoria = {
                nombre: nombre.trim(),
                tipo,
                icono: icono.trim() || null,
            }

            if (editandoId) {
                await categoriasApi.actualizar(
                    editandoId,
                    categoria
                )

                setMensaje(
                    'Categoría actualizada correctamente.'
                )
            } else {
                await categoriasApi.crear(categoria)

                setMensaje(
                    'Categoría creada correctamente.'
                )
            }

            limpiarFormulario()
            await cargarCategorias()
        } catch (err) {
            setError(err.message)
        } finally {
            setProcesando(false)
        }
    }

    function editarCategoria(categoria) {
        setEditandoId(categoria.idCategoria)
        setNombre(categoria.nombre)
        setTipo(categoria.tipo)
        setIcono(categoria.icono || '')

        setMensaje('')
        setError('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    function eliminarCategoria(id) {
        setConfirmModal({
            abierto: true,
            id,
            titulo: 'Eliminar categoría',
            mensaje: '¿Seguro que deseas eliminar esta categoría? Esta acción no se puede deshacer.',
        })
    }

    async function confirmarEliminarCategoria() {
        const id = confirmModal.id
        setConfirmModal({ abierto: false, id: null, titulo: '', mensaje: '' })

        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            await categoriasApi.eliminar(id)

            setMensaje('Categoría eliminada correctamente.')

            await cargarCategorias()
        } catch (err) {
            setError(err.message)
        } finally {
            setProcesando(false)
        }
    }

    function limpiarFormulario() {
        setEditandoId(null)
        setNombre('')
        setTipo('Gasto')
        setIcono('')
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
            <div className="mb-6 sm:mb-8">

                <h1 className="text-2xl font-bold text-gray-800">
                    Categorías
                </h1>

                <p className="text-gray-500">
                    Administra las categorías de tus ingresos y gastos.
                </p>

            </div>

            {/* FORMULARIO */}
            <section className="mb-6 rounded-[14px] bg-white p-4 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:mb-8 sm:p-6">

                <h2 className="mb-5 text-xl font-semibold text-slate-900">
                    {editandoId
                        ? 'Editar categoría'
                        : 'Crear categoría'}
                </h2>

                <form onSubmit={guardarCategoria}>

                    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">

                        {/* NOMBRE */}
                        <div className="flex min-w-0 flex-col gap-2">

                            <label className="font-semibold text-gray-700">
                                Nombre
                            </label>

                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) =>
                                    setNombre(e.target.value)
                                }
                                placeholder="Ej. Alimentación"
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                            />

                        </div>

                        {/* TIPO */}
                        <div className="flex min-w-0 flex-col gap-2">

                            <label className="font-semibold text-gray-700">
                                Tipo
                            </label>

                            <select
                                value={tipo}
                                onChange={(e) =>
                                    setTipo(e.target.value)
                                }
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-gray-100"
                            >
                                <option value="Gasto">
                                    Gasto
                                </option>

                                <option value="Ingreso">
                                    Ingreso
                                </option>
                            </select>

                        </div>

                        {/* ICONO */}
                        <div className="flex min-w-0 flex-col gap-2 md:col-span-2">

                            <label className="font-semibold text-gray-700">
                                Ícono
                            </label>

                            <input
                                type="text"
                                value={icono}
                                onChange={(e) =>
                                    setIcono(e.target.value)
                                }
                                placeholder="Ej. comida"
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
                            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:-translate-y-px hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {procesando
                                ? 'Guardando...'
                                : editandoId
                                    ? 'Actualizar'
                                    : 'Crear categoría'}
                        </button>

                        {editandoId && (
                            <button
                                type="button"
                                onClick={limpiarFormulario}
                                disabled={procesando}
                                className="w-full rounded-lg bg-gray-500 px-5 py-3 font-semibold text-white transition hover:-translate-y-px hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                Cancelar
                            </button>
                        )}

                    </div>

                </form>

            </section>

            {/* CATEGORÍAS REGISTRADAS */}
            <section className="mb-8 overflow-hidden rounded-[14px] bg-white p-4 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:p-6">

                <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">
                            Categorías registradas
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Lista de categorías disponibles.
                        </p>
                    </div>

                    <button
                        onClick={cargarCategorias}
                        disabled={cargando || procesando}
                        className="w-full rounded-lg bg-gray-700 px-4 py-2.5 font-semibold text-white transition hover:-translate-y-px hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                        {cargando
                            ? 'Cargando...'
                            : 'Actualizar'}
                    </button>

                </div>

                {cargando ? (

                    <Loading mensaje="Cargando categorías..." />

                ) : categorias.length === 0 ? (

                    <div className="p-8 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                            🏷️
                        </div>
                        <p className="mt-4 font-medium text-gray-700">
                            No hay categorías registradas.
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            Crea tu primera categoría usando el formulario de arriba.
                        </p>
                    </div>

                ) : (

                    <div className="w-full overflow-x-auto">

                        <table className="w-full min-w-[650px] border-collapse">

                            <thead>
                                <tr>

                                    <th className="bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                        Nombre
                                    </th>

                                    <th className="bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                        Tipo
                                    </th>

                                    <th className="bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                        Ícono
                                    </th>

                                    <th className="bg-blue-50 px-3 py-3 text-left text-sm font-bold text-gray-700 sm:px-3.5">
                                        Acciones
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {categorias.map((categoria) => (

                                    <tr
                                        key={categoria.idCategoria}
                                        className="transition hover:bg-gray-50"
                                    >

                                        {/* NOMBRE */}
                                        <td className="border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">
                                            {categoria.nombre}
                                        </td>

                                        {/* TIPO */}
                                        <td className="border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">

                                            <span
                                                className={
                                                    categoria.tipo === 'Ingreso'
                                                        ? 'inline-block whitespace-nowrap rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700 sm:text-sm'
                                                        : 'inline-block whitespace-nowrap rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600 sm:text-sm'
                                                }
                                            >
                                                {categoria.tipo}
                                            </span>

                                        </td>

                                        {/* ICONO */}
                                        <td className="border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">
                                            {categoria.icono || '-'}
                                        </td>

                                        {/* ACCIONES */}
                                        <td className="border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">

                                            <div className="flex flex-col gap-2 sm:flex-row">

                                                <button
                                                    onClick={() =>
                                                        editarCategoria(
                                                            categoria
                                                        )
                                                    }
                                                    disabled={procesando}
                                                    className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        eliminarCategoria(
                                                            categoria.idCategoria
                                                        )
                                                    }
                                                    disabled={procesando}
                                                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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

                )}

            </section>

            <ConfirmModal
                abierto={confirmModal.abierto}
                titulo={confirmModal.titulo}
                mensaje={confirmModal.mensaje}
                onConfirmar={confirmarEliminarCategoria}
                onCancelar={() => setConfirmModal({ abierto: false, id: null, titulo: '', mensaje: '' })}
            />

        </div>
    )
}
