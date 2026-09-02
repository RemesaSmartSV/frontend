import { useEffect, useState } from 'react'
import { categoriasApi } from '../services/api'

export default function Categorias() {
    const [categorias, setCategorias] = useState([])
    const [nombre, setNombre] = useState('')
    const [tipo, setTipo] = useState('Gasto')
    const [icono, setIcono] = useState('')

    const [editandoId, setEditandoId] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    useEffect(() => {
        cargarCategorias()
    }, [])

    async function cargarCategorias() {
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
    }

    async function guardarCategoria(e) {
        e.preventDefault()

        if (!nombre.trim()) {
            setError('Escribe el nombre de la categoría.')
            return
        }

        try {
            setError('')
            setMensaje('')

            const categoria = {
                nombre: nombre.trim(),
                tipo,
                icono: icono.trim() || null,
            }

            if (editandoId) {
                await categoriasApi.actualizar(editandoId, categoria)
                setMensaje('Categoría actualizada correctamente.')
            } else {
                await categoriasApi.crear(categoria)
                setMensaje('Categoría creada correctamente.')
            }

            limpiarFormulario()
            await cargarCategorias()
        } catch (err) {
            setError(err.message)
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

    async function eliminarCategoria(id) {
        const confirmar = window.confirm(
            '¿Seguro que deseas eliminar esta categoría?'
        )

        if (!confirmar) {
            return
        }

        try {
            setError('')
            setMensaje('')

            await categoriasApi.eliminar(id)

            setMensaje('Categoría eliminada correctamente.')
            await cargarCategorias()
        } catch (err) {
            setError(err.message)
        }
    }

    function limpiarFormulario() {
        setEditandoId(null)
        setNombre('')
        setTipo('Gasto')
        setIcono('')
    }

    return (
        <main className="mx-auto max-w-5xl p-4 font-sans text-slate-800 sm:p-8">

            <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">
                Categorías
            </h1>

            <p className="mb-8 text-gray-500">
                Administra las categorías de tus ingresos y gastos.
            </p>

            {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-100 px-4 py-3.5 text-red-800">
                    {error}
                </div>
            )}

            {mensaje && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-100 px-4 py-3.5 text-green-800">
                    {mensaje}
                </div>
            )}

            <section className="mb-8 rounded-[14px] bg-white p-5 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:p-6">

                <h2 className="mb-5 text-xl font-semibold text-slate-900">
                    {editandoId
                        ? 'Editar categoría'
                        : 'Crear categoría'}
                </h2>

                <form onSubmit={guardarCategoria}>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        <div className="flex flex-col gap-2">
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
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700">
                                Tipo
                            </label>

                            <select
                                value={tipo}
                                onChange={(e) =>
                                    setTipo(e.target.value)
                                }
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                            >
                                <option value="Gasto">
                                    Gasto
                                </option>

                                <option value="Ingreso">
                                    Ingreso
                                </option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2 md:col-span-2">
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
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                            />
                        </div>

                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:-translate-y-px hover:bg-blue-700"
                        >
                            {editandoId
                                ? 'Actualizar'
                                : 'Crear categoría'}
                        </button>

                        {editandoId && (
                            <button
                                type="button"
                                onClick={limpiarFormulario}
                                className="rounded-lg bg-gray-500 px-5 py-2.5 font-semibold text-white transition hover:-translate-y-px hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                        )}

                    </div>

                </form>
            </section>

            <section className="mb-8 rounded-[14px] bg-white p-5 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:p-6">

                <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

                    <h2 className="text-xl font-semibold text-slate-900">
                        Categorías registradas
                    </h2>

                    <button
                        onClick={cargarCategorias}
                        className="rounded-lg bg-gray-700 px-4 py-2.5 font-semibold text-white transition hover:-translate-y-px hover:bg-gray-800"
                    >
                        Actualizar
                    </button>

                </div>

                {cargando ? (
                    <p>Cargando categorías...</p>

                ) : categorias.length === 0 ? (

                    <p className="text-gray-500">
                        No hay categorías registradas.
                    </p>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full border-collapse">

                            <thead>
                                <tr>
                                    <th className="bg-blue-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Nombre
                                    </th>

                                    <th className="bg-blue-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Tipo
                                    </th>

                                    <th className="bg-blue-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Ícono
                                    </th>

                                    <th className="bg-blue-50 px-3.5 py-3 text-left font-bold text-gray-700">
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

                                        <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                            {categoria.nombre}
                                        </td>

                                        <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm font-bold">
                                            <span
                                                className={
                                                    categoria.tipo === 'Ingreso'
                                                        ? 'inline-block rounded-full bg-green-100 px-2.5 py-1 text-sm font-bold text-green-700'
                                                        : 'inline-block rounded-full bg-red-100 px-2.5 py-1 text-sm font-bold text-red-600'
                                                }
                                            >
                                                {categoria.tipo}
                                            </span>
                                        </td>

                                        <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                            {categoria.icono || '-'}
                                        </td>

                                        <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                            <div className="flex flex-col gap-2 sm:flex-row">

                                                <button
                                                    onClick={() =>
                                                        editarCategoria(
                                                            categoria
                                                        )
                                                    }
                                                    className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        eliminarCategoria(
                                                            categoria.idCategoria
                                                        )
                                                    }
                                                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                                                >
                                                    Eliminar
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

        </main>
    )
}
