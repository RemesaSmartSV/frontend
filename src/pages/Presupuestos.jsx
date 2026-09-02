import { useEffect, useState } from 'react'
import { categoriasApi, presupuestosApi } from '../services/api'

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
    const [error, setError] = useState('')

    useEffect(() => {
        cargarDatos()
    }, [])

    async function cargarDatos() {
        try {
            setCargando(true)
            setError('')

            const [presupuestosData, categoriasData] = await Promise.all([
                presupuestosApi.listar(),
                categoriasApi.listar(),
            ])

            setPresupuestos(presupuestosData)
            setCategorias(categoriasData)
        } catch (error) {
            setError(error.message)
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

        try {
            setError('')

            const datos = {
                idCategoria: Number(formulario.idCategoria),
                montoLimite: Number(formulario.montoLimite),
                mesAnio: `${formulario.mesAnio}-01`,
            }

            if (editando) {
                await presupuestosApi.actualizar(editando, datos)
            } else {
                await presupuestosApi.crear(datos)
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (error) {
            setError(error.message)
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

            await presupuestosApi.eliminar(id)
            await cargarDatos()
        } catch (error) {
            setError(error.message)
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

        return categoria ? categoria.nombre : 'Sin categoría'
    }

    return (
        <div className="space-y-6">

            {/* Encabezado */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">
                    Presupuestos
                </h1>

                <p className="mt-1 text-gray-600">
                    Administra los límites de gasto de tu hogar.
                </p>
            </div>

            {/* Mensaje de error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Formulario */}
            <section className="rounded-xl bg-white p-6 shadow-md">

                <h2 className="mb-6 text-xl font-semibold text-gray-800">
                    {editando
                        ? 'Editar presupuesto'
                        : 'Crear presupuesto'}
                </h2>

                <form
                    onSubmit={manejarSubmit}
                    className="grid grid-cols-1 gap-5 md:grid-cols-3"
                >

                    {/* Categoría */}
                    <div>
                        <label
                            htmlFor="idCategoria"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Categoría
                        </label>

                        <select
                            id="idCategoria"
                            name="idCategoria"
                            value={formulario.idCategoria}
                            onChange={manejarCambio}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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

                    {/* Monto */}
                    <div>
                        <label
                            htmlFor="montoLimite"
                            className="mb-2 block text-sm font-medium text-gray-700"
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
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* Mes */}
                    <div>
                        <label
                            htmlFor="mesAnio"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Mes
                        </label>

                        <input
                            id="mesAnio"
                            name="mesAnio"
                            type="month"
                            value={formulario.mesAnio}
                            onChange={manejarCambio}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex flex-wrap items-end gap-3 md:col-span-3">

                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
                        >
                            {editando
                                ? 'Actualizar presupuesto'
                                : 'Guardar presupuesto'}
                        </button>

                        {editando && (
                            <button
                                type="button"
                                onClick={limpiarFormulario}
                                className="rounded-lg bg-gray-200 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                        )}

                    </div>

                </form>
            </section>

            {/* Tabla */}
            <section className="rounded-xl bg-white p-6 shadow-md">

                <div className="mb-5">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Mis presupuestos
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Consulta y administra tus presupuestos registrados.
                    </p>
                </div>

                {cargando ? (
                    <div className="py-8 text-center text-gray-500">
                        Cargando presupuestos...
                    </div>
                ) : presupuestos.length === 0 ? (
                    <div className="rounded-lg bg-gray-50 py-8 text-center text-gray-500">
                        No tienes presupuestos registrados.
                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="w-full text-left text-sm">

                            <thead className="border-b bg-gray-50 text-gray-700">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">
                                        Categoría
                                    </th>

                                    <th className="px-4 py-3 font-semibold">
                                        Mes
                                    </th>

                                    <th className="px-4 py-3 font-semibold">
                                        Monto límite
                                    </th>

                                    <th className="px-4 py-3 text-center font-semibold">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">

                                {presupuestos.map((presupuesto) => (
                                    <tr
                                        key={presupuesto.idPresupuesto}
                                        className="transition hover:bg-gray-50"
                                    >

                                        <td className="px-4 py-3 text-gray-700">
                                            {obtenerNombreCategoria(
                                                presupuesto.idCategoria
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-gray-700">
                                            {presupuesto.mesAnio
                                                ? presupuesto.mesAnio.substring(0, 7)
                                                : ''}
                                        </td>

                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            $
                                            {Number(
                                                presupuesto.montoLimite
                                            ).toFixed(2)}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-2">

                                                <button
                                                    onClick={() =>
                                                        editarPresupuesto(
                                                            presupuesto
                                                        )
                                                    }
                                                    className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-200"
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        eliminarPresupuesto(
                                                            presupuesto.idPresupuesto
                                                        )
                                                    }
                                                    className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-200"
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

        </div>
    )
}
