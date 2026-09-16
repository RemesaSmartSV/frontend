import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    categoriasApi,
    presupuestosApi,
    movimientosApi
} from '../services/api'

import Notification from '../components/Notification'
import ConfirmModal from '../components/ConfirmModal'
import Loading from '../components/Loading'
import Pagination from '../components/Pagination'

function Presupuestos() {
    const [presupuestos, setPresupuestos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [movimientos, setMovimientos] = useState([])

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

    const [confirmModal, setConfirmModal] = useState({
        abierto: false,
        id: null,
        mensaje: '',
    })

    const [filtros, setFiltros] = useState({
        idCategoria: '',
        mesAnio: '',
        montoMinimo: '',
        montoMaximo: '',
        busqueda: '',
    })

    const [paginaActual, setPaginaActual] = useState(1)
    const registrosPorPagina = 5

    // ==========================================
    // CARGAR DATOS
    // ==========================================

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true)
            setError('')

            const [
                presupuestosData,
                categoriasData,
                movimientosData
            ] = await Promise.all([
                presupuestosApi.listar(),
                categoriasApi.listar(),
                movimientosApi.listar(),
            ])

            setPresupuestos(presupuestosData || [])
            setCategorias(categoriasData || [])
            setMovimientos(movimientosData || [])

            setPaginaActual(1)
        } catch (err) {
            setError(err.message || 'No se pudieron cargar los datos.')
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        cargarDatos()
    }, [cargarDatos])

    // ==========================================
    // FORMULARIO
    // ==========================================

    const manejarCambio = (e) => {
        const { name, value } = e.target

        setFormulario((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const limpiarFormulario = () => {
        setFormulario({
            idCategoria: '',
            montoLimite: '',
            mesAnio: '',
        })

        setEditando(null)
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        setError('')
        setMensaje('')

        if (!formulario.idCategoria) {
            setError('Selecciona una categoría.')
            return
        }

        if (!formulario.montoLimite) {
            setError('Ingresa un monto límite.')
            return
        }

        if (Number(formulario.montoLimite) <= 0) {
            setError('El monto límite debe ser mayor que 0.')
            return
        }

        if (!formulario.mesAnio) {
            setError('Selecciona el mes del presupuesto.')
            return
        }

        try {
            setProcesando(true)

            const datos = {
                idCategoria: Number(formulario.idCategoria),
                montoLimite: Number(formulario.montoLimite),
                mesAnio: `${formulario.mesAnio}-01`,
            }

            if (editando) {
                await presupuestosApi.actualizar(editando, datos)
                setMensaje('Presupuesto actualizado correctamente.')
            } else {
                await presupuestosApi.crear(datos)
                setMensaje('Presupuesto creado correctamente.')
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (err) {
            setError(err.message || 'No se pudo guardar el presupuesto.')
        } finally {
            setProcesando(false)
        }
    }

    // ==========================================
    // EDITAR
    // ==========================================

    const editarPresupuesto = (presupuesto) => {
        setEditando(presupuesto.idPresupuesto)

        setFormulario({
            idCategoria: String(presupuesto.idCategoria),
            montoLimite: String(presupuesto.montoLimite),
            mesAnio: presupuesto.mesAnio
                ? presupuesto.mesAnio.substring(0, 7)
                : '',
        })

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    // ==========================================
    // ELIMINAR
    // ==========================================

    const solicitarEliminar = (id) => {
        setConfirmModal({
            abierto: true,
            id,
            mensaje: '¿Estás segura de que deseas eliminar este presupuesto?',
        })
    }

    const confirmarEliminar = async () => {
        try {
            setProcesando(true)
            setError('')

            await presupuestosApi.eliminar(confirmModal.id)

            setMensaje('Presupuesto eliminado correctamente.')

            setConfirmModal({
                abierto: false,
                id: null,
                mensaje: '',
            })

            await cargarDatos()
        } catch (err) {
            setError(err.message || 'No se pudo eliminar el presupuesto.')
        } finally {
            setProcesando(false)
        }
    }

    // ==========================================
    // OBTENER CATEGORÍA
    // ==========================================

    const obtenerNombreCategoria = (idCategoria) => {
        const categoria = categorias.find(
            (item) =>
                Number(item.idCategoria) === Number(idCategoria)
        )

        return categoria?.nombre || 'Sin categoría'
    }

    // ==========================================
    // CALCULAR PROGRESO
    // ==========================================

    const obtenerProgresoPresupuesto = (presupuesto) => {
        const categoriaId = Number(presupuesto.idCategoria)

        const mesPresupuesto = presupuesto.mesAnio
            ? presupuesto.mesAnio.substring(0, 7)
            : ''

        const gastos = movimientos.filter((movimiento) => {
            const tipo = String(
                movimiento.tipo || ''
            ).toLowerCase()

            const fechaMovimiento = movimiento.fecha
                ? String(movimiento.fecha).substring(0, 7)
                : ''

            return (
                tipo === 'gasto' &&
                Number(movimiento.idCategoria) === categoriaId &&
                fechaMovimiento === mesPresupuesto
            )
        })

        const gastado = gastos.reduce(
            (total, movimiento) => {
                return total + Number(movimiento.monto || 0)
            },
            0
        )

        const limite = Number(
            presupuesto.montoLimite || 0
        )

        const porcentaje = limite > 0
            ? (gastado / limite) * 100
            : 0

        const porcentajeBarra = Math.min(
            Math.max(porcentaje, 0),
            100
        )

        let estado = 'normal'

        if (porcentaje >= 90) {
            estado = 'peligro'
        } else if (porcentaje >= 70) {
            estado = 'advertencia'
        }

        return {
            gastado,
            limite,
            porcentaje,
            porcentajeBarra,
            estado,
        }
    }

    // ==========================================
    // COLOR DE LA BARRA
    // ==========================================

    const obtenerColorBarra = (estado) => {
        if (estado === 'peligro') {
            return 'bg-red-500'
        }

        if (estado === 'advertencia') {
            return 'bg-yellow-400'
        }

        return 'bg-green-500'
    }

    // ==========================================
    // FILTROS
    // ==========================================

    const manejarCambioFiltro = (e) => {
        const { name, value } = e.target

        setFiltros((prev) => ({
            ...prev,
            [name]: value,
        }))

        setPaginaActual(1)
    }

    const limpiarFiltros = () => {
        setFiltros({
            idCategoria: '',
            mesAnio: '',
            montoMinimo: '',
            montoMaximo: '',
            busqueda: '',
        })

        setPaginaActual(1)
    }

    // ==========================================
    // FILTRAR PRESUPUESTOS
    // ==========================================

    const presupuestosFiltrados = useMemo(() => {
        return presupuestos.filter((presupuesto) => {
            const nombreCategoria =
                obtenerNombreCategoria(
                    presupuesto.idCategoria
                ).toLowerCase()

            const categoriaCoincide =
                !filtros.idCategoria ||
                Number(presupuesto.idCategoria) ===
                Number(filtros.idCategoria)

            const mesPresupuesto =
                presupuesto.mesAnio
                    ? presupuesto.mesAnio.substring(0, 7)
                    : ''

            const mesCoincide =
                !filtros.mesAnio ||
                mesPresupuesto === filtros.mesAnio

            const monto = Number(
                presupuesto.montoLimite || 0
            )

            const montoMinimoCoincide =
                !filtros.montoMinimo ||
                monto >= Number(filtros.montoMinimo)

            const montoMaximoCoincide =
                !filtros.montoMaximo ||
                monto <= Number(filtros.montoMaximo)

            const busquedaCoincide =
                !filtros.busqueda ||
                nombreCategoria.includes(
                    filtros.busqueda.toLowerCase()
                )

            return (
                categoriaCoincide &&
                mesCoincide &&
                montoMinimoCoincide &&
                montoMaximoCoincide &&
                busquedaCoincide
            )
        })
    }, [presupuestos, categorias, filtros])

    // ==========================================
    // PAGINACIÓN
    // ==========================================

    const totalPaginas = Math.ceil(
        presupuestosFiltrados.length /
        registrosPorPagina
    )

    const presupuestosPaginados = useMemo(() => {
        const inicio =
            (paginaActual - 1) *
            registrosPorPagina

        return presupuestosFiltrados.slice(
            inicio,
            inicio + registrosPorPagina
        )
    }, [
        presupuestosFiltrados,
        paginaActual,
    ])

    // ==========================================
    // EXPORTAR CSV
    // ==========================================

    const exportarCSV = () => {
        if (presupuestosFiltrados.length === 0) {
            setError(
                'No hay presupuestos para exportar.'
            )
            return
        }

        const encabezados = [
            'Categoría',
            'Mes',
            'Monto límite',
            'Gastado',
            'Porcentaje',
        ]

        const filas =
            presupuestosFiltrados.map(
                (presupuesto) => {
                    const progreso =
                        obtenerProgresoPresupuesto(
                            presupuesto
                        )

                    return [
                        obtenerNombreCategoria(
                            presupuesto.idCategoria
                        ),
                        presupuesto.mesAnio
                            ? presupuesto.mesAnio.substring(0, 7)
                            : '',
                        Number(
                            presupuesto.montoLimite
                        ).toFixed(2),
                        progreso.gastado.toFixed(2),
                        `${progreso.porcentaje.toFixed(2)}%`,
                    ]
                }
            )

        const contenido = [
            encabezados,
            ...filas,
        ]
            .map((fila) => fila.join(','))
            .join('\n')

        const blob = new Blob(
            [contenido],
            {
                type: 'text/csv;charset=utf-8;',
            }
        )

        const url =
            URL.createObjectURL(blob)

        const enlace =
            document.createElement('a')

        enlace.href = url
        enlace.download =
            'presupuestos.csv'

        document.body.appendChild(enlace)

        enlace.click()

        document.body.removeChild(enlace)

        URL.revokeObjectURL(url)
    }

    // ==========================================
    // CARGANDO
    // ==========================================

    if (cargando) {
        return <Loading />
    }

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="space-y-6">

            {/* ENCABEZADO */}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Presupuestos
                    </h1>

                    <p className="text-gray-500">
                        Controla tus límites de gasto y revisa tu progreso.
                    </p>
                </div>

                <div className="flex gap-2">

                    <button
                        type="button"
                        onClick={exportarCSV}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                        Exportar CSV
                    </button>

                    <button
                        type="button"
                        onClick={cargarDatos}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Actualizar
                    </button>

                </div>

            </div>

            {/* NOTIFICACIONES */}

            {error && (
                <Notification
                    type="error"
                    message={error}
                    onClose={() => setError('')}
                />
            )}

            {mensaje && (
                <Notification
                    type="success"
                    message={mensaje}
                    onClose={() => setMensaje('')}
                />
            )}

            {/* FORMULARIO */}

            <div className="rounded-xl bg-white p-6 shadow-sm">

                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                    {editando
                        ? 'Editar presupuesto'
                        : 'Crear presupuesto'}
                </h2>

                <form
                    onSubmit={manejarSubmit}
                    className="grid grid-cols-1 gap-4 md:grid-cols-3"
                >

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Categoría
                        </label>

                        <select
                            name="idCategoria"
                            value={formulario.idCategoria}
                            onChange={manejarCambio}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                        >
                            <option value="">
                                Selecciona una categoría
                            </option>

                            {categorias
                                .filter(
                                    (categoria) =>
                                        String(
                                            categoria.tipo || ''
                                        ).toLowerCase() === 'gasto'
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

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Monto límite
                        </label>

                        <input
                            type="number"
                            name="montoLimite"
                            min="0.01"
                            step="0.01"
                            value={
                                formulario.montoLimite
                            }
                            onChange={manejarCambio}
                            placeholder="Ej. 100.00"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Mes
                        </label>

                        <input
                            type="month"
                            name="mesAnio"
                            value={
                                formulario.mesAnio
                            }
                            onChange={manejarCambio}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex gap-2 md:col-span-3">

                        <button
                            type="submit"
                            disabled={procesando}
                            className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {procesando
                                ? 'Guardando...'
                                : editando
                                    ? 'Actualizar'
                                    : 'Crear presupuesto'}
                        </button>

                        {editando && (
                            <button
                                type="button"
                                onClick={
                                    limpiarFormulario
                                }
                                className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                        )}

                    </div>

                </form>

            </div>

            {/* FILTROS */}

            <div className="rounded-xl bg-white p-6 shadow-sm">

                <div className="mb-4 flex items-center justify-between">

                    <h2 className="text-lg font-semibold text-gray-800">
                        Filtros
                    </h2>

                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        Limpiar filtros
                    </button>

                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Categoría
                        </label>

                        <select
                            name="idCategoria"
                            value={
                                filtros.idCategoria
                            }
                            onChange={
                                manejarCambioFiltro
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        >
                            <option value="">
                                Todas
                            </option>

                            {categorias.map(
                                (categoria) => (
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
                                )
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Mes
                        </label>

                        <input
                            type="month"
                            name="mesAnio"
                            value={
                                filtros.mesAnio
                            }
                            onChange={
                                manejarCambioFiltro
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Monto mínimo
                        </label>

                        <input
                            type="number"
                            name="montoMinimo"
                            min="0"
                            step="0.01"
                            value={
                                filtros.montoMinimo
                            }
                            onChange={
                                manejarCambioFiltro
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Monto máximo
                        </label>

                        <input
                            type="number"
                            name="montoMaximo"
                            min="0"
                            step="0.01"
                            value={
                                filtros.montoMaximo
                            }
                            onChange={
                                manejarCambioFiltro
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Buscar categoría
                        </label>

                        <input
                            type="text"
                            name="busqueda"
                            value={
                                filtros.busqueda
                            }
                            onChange={
                                manejarCambioFiltro
                            }
                            placeholder="Buscar..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </div>

                </div>

            </div>

            {/* TABLA */}

            <div className="overflow-hidden rounded-xl bg-white shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[800px]">

                        <thead className="bg-gray-50">

                            <tr>

                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                    Categoría
                                </th>

                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                    Mes
                                </th>

                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                    Monto límite
                                </th>

                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                    Progreso
                                </th>

                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                    Acciones
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-100">

                            {presupuestosPaginados.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="5"
                                        className="px-6 py-10 text-center text-gray-500"
                                    >
                                        No tienes presupuestos registrados.
                                    </td>

                                </tr>

                            ) : (

                                presupuestosPaginados.map(
                                    (presupuesto) => {

                                        const progreso =
                                            obtenerProgresoPresupuesto(
                                                presupuesto
                                            )

                                        const colorBarra =
                                            obtenerColorBarra(
                                                progreso.estado
                                            )

                                        return (
                                            <tr
                                                key={
                                                    presupuesto.idPresupuesto
                                                }
                                                className="hover:bg-gray-50"
                                            >

                                                <td className="px-6 py-4">

                                                    <span className="font-medium text-gray-800">
                                                        {
                                                            obtenerNombreCategoria(
                                                                presupuesto.idCategoria
                                                            )
                                                        }
                                                    </span>

                                                </td>

                                                <td className="px-6 py-4 text-gray-600">

                                                    {presupuesto.mesAnio
                                                        ? presupuesto.mesAnio.substring(
                                                            0,
                                                            7
                                                        )
                                                        : '-'}

                                                </td>

                                                <td className="px-6 py-4 font-medium text-gray-800">

                                                    $
                                                    {Number(
                                                        presupuesto.montoLimite
                                                    ).toFixed(2)}

                                                </td>

                                                <td className="px-6 py-4">

                                                    <div className="min-w-[180px]">

                                                        <div className="mb-1 flex justify-between text-xs">

                                                            <span className="text-gray-500">
                                                                $
                                                                {progreso.gastado.toFixed(
                                                                    2
                                                                )}
                                                            </span>

                                                            <span className="font-semibold text-gray-700">
                                                                {progreso.porcentaje.toFixed(
                                                                    0
                                                                )}
                                                                %
                                                            </span>

                                                        </div>

                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">

                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${colorBarra}`}
                                                                style={{
                                                                    width: `${progreso.porcentajeBarra}%`,
                                                                }}
                                                            />

                                                        </div>

                                                    </div>

                                                </td>

                                                <td className="px-6 py-4">

                                                    <div className="flex gap-2">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                editarPresupuesto(
                                                                    presupuesto
                                                                )
                                                            }
                                                            className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                solicitarEliminar(
                                                                    presupuesto.idPresupuesto
                                                                )
                                                            }
                                                            className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                                                        >
                                                            Eliminar
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        )
                                    }
                                )

                            )}

                        </tbody>

                    </table>

                </div>

                {totalPaginas > 1 && (
                    <div className="border-t border-gray-100 p-4">

                        <Pagination
                            paginaActual={
                                paginaActual
                            }
                            totalPaginas={
                                totalPaginas
                            }
                            onPageChange={
                                setPaginaActual
                            }
                        />

                    </div>
                )}

            </div>

            {/* MODAL DE CONFIRMACIÓN */}

            <ConfirmModal
                abierto={
                    confirmModal.abierto
                }
                mensaje={
                    confirmModal.mensaje
                }
                onConfirm={
                    confirmarEliminar
                }
                onCancel={() =>
                    setConfirmModal({
                        abierto: false,
                        id: null,
                        mensaje: '',
                    })
                }
                cargando={
                    procesando
                }
            />

        </div>
    )
}

export default Presupuestos