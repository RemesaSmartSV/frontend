import { useEffect, useState } from 'react'
import { categoriasApi, movimientosApi } from '../services/api'

export default function Remesas() {
    const [remesas, setRemesas] = useState([])
    const [categorias, setCategorias] = useState([])

    const [formulario, setFormulario] = useState({
        idCategoria: '',
        monto: '',
        fecha: '',
        origenEmisora: '',
        descripcion: '',
    })

    const [editandoId, setEditandoId] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

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

            const remesasFiltradas = movimientosData.filter(
                (movimiento) =>
                    movimiento.tipo === 'Ingreso' &&
                    movimiento.origenEmisora
            )

            setRemesas(remesasFiltradas)
            setCategorias(categoriasData)
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

                setMensaje('Remesa actualizada correctamente.')
            } else {
                await movimientosApi.crear(movimiento)

                setMensaje('Remesa registrada correctamente.')
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (err) {
            setError(err.message)
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

    async function eliminarRemesa(id) {
        const confirmar = window.confirm(
            '¿Seguro que deseas eliminar esta remesa?'
        )

        if (!confirmar) {
            return
        }

        try {
            setError('')
            setMensaje('')

            await movimientosApi.eliminar(id)

            setMensaje('Remesa eliminada correctamente.')
            await cargarDatos()
        } catch (err) {
            setError(err.message)
        }
    }

    function limpiarFormulario() {
        setEditandoId(null)

        setFormulario({
            idCategoria: '',
            monto: '',
            fecha: '',
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

    return (
        <main className="mx-auto max-w-5xl p-4 font-sans text-slate-800 sm:p-8">

            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                    <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">
                        Remesas
                    </h1>

                    <p className="text-gray-500">
                        Registra y administra las remesas
                        recibidas por tu hogar.
                    </p>
                </div>

                <button
                    onClick={cargarDatos}
                    className="w-full rounded-lg bg-gray-700 px-4 py-2.5 font-semibold text-white transition hover:-translate-y-px hover:bg-gray-800 sm:w-auto"
                >
                    Actualizar
                </button>

            </div>

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
                        ? 'Editar remesa'
                        : 'Registrar remesa'}
                </h2>

                <form onSubmit={guardarRemesa}>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700">
                                Categoría
                            </label>

                            <select
                                name="idCategoria"
                                value={formulario.idCategoria}
                                onChange={manejarCambio}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
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

                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700">
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
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 placeholder:text-gray-400"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700">
                                Fecha
                            </label>

                            <input
                                type="date"
                                name="fecha"
                                value={formulario.fecha}
                                onChange={manejarCambio}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700">
                                Origen / Emisora
                            </label>

                            <input
                                type="text"
                                name="origenEmisora"
                                value={formulario.origenEmisora}
                                onChange={manejarCambio}
                                placeholder="Ej. Estados Unidos"
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 placeholder:text-gray-400"
                            />
                        </div>

                        <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="font-semibold text-gray-700">
                                Descripción
                            </label>

                            <input
                                type="text"
                                name="descripcion"
                                value={formulario.descripcion}
                                onChange={manejarCambio}
                                placeholder="Descripción de la remesa"
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 placeholder:text-gray-400"
                            />
                        </div>

                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                        <button
                            type="submit"
                            className="rounded-lg bg-violet-600 px-5 py-2.5 font-semibold text-white transition hover:-translate-y-px hover:bg-violet-700"
                        >
                            {editandoId
                                ? 'Actualizar remesa'
                                : 'Guardar remesa'}
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

                <h2 className="mb-5 text-xl font-semibold text-slate-900">
                    Remesas registradas
                </h2>

                {cargando ? (
                    <p>Cargando remesas...</p>

                ) : remesas.length === 0 ? (

                    <p className="text-gray-500">
                        No hay remesas registradas.
                    </p>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full border-collapse">

                            <thead>
                                <tr>
                                    <th className="bg-violet-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Fecha
                                    </th>

                                    <th className="bg-violet-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Origen
                                    </th>

                                    <th className="bg-violet-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Categoría
                                    </th>

                                    <th className="bg-violet-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Monto
                                    </th>

                                    <th className="bg-violet-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Descripción
                                    </th>

                                    <th className="bg-violet-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {remesas.map((remesa) => (
                                    <tr
                                        key={
                                            remesa.idMovimiento
                                        }
                                        className="transition hover:bg-violet-50"
                                    >

                                        <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                            {new Date(
                                                remesa.fecha
                                            ).toLocaleDateString()}
                                        </td>

                                        <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                            {remesa.origenEmisora}
                                        </td>

                                        <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                            {obtenerNombreCategoria(
                                                remesa.idCategoria
                                            )}
                                        </td>

                                        <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm font-bold text-violet-600">
                                            +$
                                            {Number(
                                                remesa.monto
                                            ).toFixed(2)}
                                        </td>

                                        <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">
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
                                                    className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        eliminarRemesa(
                                                            remesa.idMovimiento
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

