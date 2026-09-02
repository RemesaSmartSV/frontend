import { useEffect, useState } from 'react'
import { categoriasApi, movimientosApi } from '../services/api'

export default function Movimientos() {
    const [movimientos, setMovimientos] = useState([])
    const [categorias, setCategorias] = useState([])

    const [formulario, setFormulario] = useState({
        idCategoria: '',
        monto: '',
        fecha: '',
        tipo: 'Ingreso',
        descripcion: '',
        origenEmisora: '',
    })

    const [editandoId, setEditandoId] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        cargarDatos()
    }, [])

    async function cargarDatos() {
        try {
            setCargando(true)
            setError('')

            const [movimientosData, categoriasData] = await Promise.all([
                movimientosApi.listar(),
                categoriasApi.listar(),
            ])

            setMovimientos(movimientosData)
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

            const movimiento = {
                idCategoria: Number(formulario.idCategoria),
                monto: Number(formulario.monto),
                fecha: formulario.fecha,
                tipo: formulario.tipo,
                descripcion: formulario.descripcion,
                origenEmisora: formulario.origenEmisora,
            }

            if (editandoId) {
                await movimientosApi.actualizar(editandoId, movimiento)
            } else {
                await movimientosApi.crear(movimiento)
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (err) {
            setError(err.message)
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

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    async function eliminarMovimiento(id) {
        const confirmar = window.confirm(
            '¿Seguro que deseas eliminar este movimiento?'
        )

        if (!confirmar) {
            return
        }

        try {
            setError('')
            await movimientosApi.eliminar(id)
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
            tipo: 'Ingreso',
            descripcion: '',
            origenEmisora: '',
        })
    }

    return (
        <div className="mx-auto max-w-5xl p-4 font-sans sm:p-8">

            {/* TÍTULO */}
            <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">
                Movimientos financieros
            </h1>

            <p className="mb-8 text-gray-500">
                Registra tus ingresos, remesas y gastos familiares.
            </p>

            {/* ERROR */}
            {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-100 px-4 py-3.5 text-red-800">
                    {error}
                </div>
            )}

            {/* FORMULARIO */}
            <section className="mb-8 rounded-[14px] bg-white p-5 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:p-6">

                <h2 className="mb-5 text-xl font-semibold text-slate-900">
                    {editandoId
                        ? 'Editar movimiento'
                        : 'Registrar movimiento'}
                </h2>

                <form onSubmit={guardarMovimiento}>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        {/* TIPO */}
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700">
                                Tipo
                            </label>

                            <select
                                name="tipo"
                                value={formulario.tipo}
                                onChange={manejarCambio}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
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
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700">
                                Categoría
                            </label>

                            <select
                                name="idCategoria"
                                value={formulario.idCategoria}
                                onChange={manejarCambio}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                            >
                                <option value="">
                                    Selecciona una categoría
                                </option>

                                {categorias.map((categoria) => (
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
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                            />
                        </div>

                        {/* FECHA */}
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700">
                                Fecha
                            </label>

                            <input
                                type="date"
                                name="fecha"
                                value={formulario.fecha}
                                onChange={manejarCambio}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                            />
                        </div>

                        {/* ORIGEN */}
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
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                            />
                        </div>

                        {/* DESCRIPCIÓN */}
                        <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="font-semibold text-gray-700">
                                Descripción
                            </label>

                            <input
                                type="text"
                                name="descripcion"
                                value={formulario.descripcion}
                                onChange={manejarCambio}
                                placeholder="Descripción del movimiento"
                                className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                            />
                        </div>

                    </div>

                    {/* BOTONES */}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 hover:-translate-y-px"
                        >
                            {editandoId ? 'Actualizar' : 'Guardar'}
                        </button>

                        {editandoId && (
                            <button
                                type="button"
                                onClick={limpiarFormulario}
                                className="rounded-lg bg-gray-500 px-5 py-2.5 font-semibold text-white transition hover:bg-gray-600 hover:-translate-y-px"
                            >
                                Cancelar
                            </button>
                        )}

                    </div>

                </form>
            </section>

            {/* LISTA */}
            <section className="mb-8 rounded-[14px] bg-white p-5 shadow-[0_3px_12px_rgba(0,0,0,0.08)] sm:p-6">

                <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

                    <h2 className="text-xl font-semibold text-slate-900">
                        Movimientos registrados
                    </h2>

                    <button
                        onClick={cargarDatos}
                        className="rounded-lg bg-gray-700 px-4 py-2.5 font-semibold text-white transition hover:bg-gray-800 hover:-translate-y-px"
                    >
                        Actualizar
                    </button>

                </div>

                {cargando ? (
                    <p>Cargando movimientos...</p>

                ) : movimientos.length === 0 ? (

                    <p className="text-gray-500">
                        No hay movimientos registrados.
                    </p>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full border-collapse">

                            <thead>
                                <tr>
                                    <th className="bg-blue-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Fecha
                                    </th>

                                    <th className="bg-blue-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Tipo
                                    </th>

                                    <th className="bg-blue-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Categoría
                                    </th>

                                    <th className="bg-blue-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Monto
                                    </th>

                                    <th className="bg-blue-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Descripción
                                    </th>

                                    <th className="bg-blue-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Origen
                                    </th>

                                    <th className="bg-blue-50 px-3.5 py-3 text-left font-bold text-gray-700">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {movimientos.map((movimiento) => {

                                    const categoria = categorias.find(
                                        (c) =>
                                            c.idCategoria ===
                                            movimiento.idCategoria
                                    )

                                    return (
                                        <tr
                                            key={movimiento.idMovimiento}
                                            className="transition hover:bg-gray-50"
                                        >

                                            <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                                {new Date(
                                                    movimiento.fecha
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">
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

                                            <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                                {categoria?.nombre ||
                                                    'Sin categoría'}
                                            </td>

                                            <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm font-semibold">
                                                $
                                                {Number(
                                                    movimiento.monto
                                                ).toFixed(2)}
                                            </td>

                                            <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                                {movimiento.descripcion ||
                                                    '-'}
                                            </td>

                                            <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                                {movimiento.origenEmisora ||
                                                    '-'}
                                            </td>

                                            <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                                <div className="flex flex-col gap-2 sm:flex-row">

                                                    <button
                                                        onClick={() =>
                                                            editarMovimiento(
                                                                movimiento
                                                            )
                                                        }
                                                        className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            eliminarMovimiento(
                                                                movimiento.idMovimiento
                                                            )
                                                        }
                                                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                                                    >
                                                        Eliminar
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>
                                    )
                                })}

                            </tbody>

                        </table>

                    </div>
                )}

            </section>

        </div>
    )
}