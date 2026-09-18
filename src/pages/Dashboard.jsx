import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts'

import {
    categoriasApi,
    movimientosApi,
} from '../services/api'

import Notification from '../components/Notification'
import Loading from '../components/Loading'
import { formatearMoneda } from '../utils/formato'

const COLORES_CATEGORIAS = [
    '#7c3aed',
    '#2563eb',
    '#16a34a',
    '#dc2626',
    '#f59e0b',
    '#0891b2',
    '#db2777',
    '#65a30d',
]

export default function Dashboard() {
    const [movimientos, setMovimientos] = useState([])
    const [categorias, setCategorias] = useState([])

    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true)
            setError('')

            const [
                movimientosData,
                categoriasData,
            ] = await Promise.all([
                movimientosApi.listar(),
                categoriasApi.listar(),
            ])

            setMovimientos(
                Array.isArray(movimientosData)
                    ? movimientosData
                    : []
            )

            setCategorias(
                Array.isArray(categoriasData)
                    ? categoriasData
                    : []
            )
        } catch (err) {
            setError(
                err.message ||
                'No se pudieron cargar los datos del dashboard.'
            )
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        cargarDatos()
    }, [cargarDatos])

    const actualizarDashboard = useCallback(async () => {
        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            await cargarDatos()

            setMensaje(
                'Resumen financiero actualizado correctamente.'
            )
        } catch (err) {
            setError(err.message)
        } finally {
            setProcesando(false)
        }
    }, [cargarDatos])

    const ingresos = useMemo(() => {
        return movimientos
            .filter(
                (m) => m.tipo === 'Ingreso'
            )
            .reduce(
                (total, m) =>
                    total + Number(m.monto || 0),
                0
            )
    }, [movimientos])

    const gastos = useMemo(() => {
        return movimientos
            .filter(
                (m) => m.tipo === 'Gasto'
            )
            .reduce(
                (total, m) =>
                    total + Number(m.monto || 0),
                0
            )
    }, [movimientos])

    const remesas = useMemo(() => {
        return movimientos
            .filter(
                (m) =>
                    m.tipo === 'Ingreso' &&
                    m.origenEmisora
            )
            .reduce(
                (total, m) =>
                    total + Number(m.monto || 0),
                0
            )
    }, [movimientos])

    const balance = ingresos - gastos

    const movimientosRecientes = useMemo(() => {
        return [...movimientos]
            .sort(
                (a, b) =>
                    new Date(b.fecha) -
                    new Date(a.fecha)
            )
            .slice(0, 5)
    }, [movimientos])

    /*
     * ==========================================
     * DATOS PARA GRÁFICA DE INGRESOS Y GASTOS
     * ==========================================
     */

    const datosMensuales = useMemo(() => {
        const meses = {}

        movimientos.forEach((movimiento) => {
            const fecha = new Date(
                movimiento.fecha
            )

            if (Number.isNaN(fecha.getTime())) {
                return
            }

            const clave =
                `${fecha.getFullYear()}-${String(
                    fecha.getMonth() + 1
                ).padStart(2, '0')}`

            if (!meses[clave]) {
                meses[clave] = {
                    clave,
                    mes: fecha.toLocaleDateString(
                        'es-SV',
                        {
                            month: 'short',
                            year: 'numeric',
                        }
                    ),
                    ingresos: 0,
                    gastos: 0,
                }
            }

            const monto =
                Number(movimiento.monto) || 0

            if (
                movimiento.tipo ===
                'Ingreso'
            ) {
                meses[clave].ingresos += monto
            }

            if (
                movimiento.tipo ===
                'Gasto'
            ) {
                meses[clave].gastos += monto
            }
        })

        return Object.values(meses)
            .sort(
                (a, b) =>
                    a.clave.localeCompare(
                        b.clave
                    )
            )
            .slice(-6)
    }, [movimientos])

    /*
     * ==========================================
     * OBTENER NOMBRE DE CATEGORÍA
     * ==========================================
     */

    const obtenerNombreCategoria =
        useCallback(
            (idCategoria) => {
                const categoria =
                    categorias.find(
                        (c) =>
                            c.idCategoria ===
                            idCategoria
                    )

                return (
                    categoria?.nombre ||
                    'Sin categoría'
                )
            },
            [categorias]
        )

    /*
     * ==========================================
     * DATOS PARA GRÁFICA DE GASTOS
     * POR CATEGORÍA
     * ==========================================
     */

    const gastosPorCategoria =
        useMemo(() => {
            const agrupados = {}

            movimientos
                .filter(
                    (m) =>
                        m.tipo ===
                        'Gasto'
                )
                .forEach((gasto) => {
                    const nombre =
                        obtenerNombreCategoria(
                            gasto.idCategoria
                        )

                    const monto =
                        Number(
                            gasto.monto
                        ) || 0

                    agrupados[nombre] =
                        (agrupados[nombre] ||
                            0) + monto
                })

            return Object.entries(
                agrupados
            )
                .map(
                    ([
                        nombre,
                        monto,
                    ]) => ({
                        nombre,
                        monto,
                    })
                )
                .sort(
                    (a, b) =>
                        b.monto -
                        a.monto
                )
        }, [
            movimientos,
            obtenerNombreCategoria,
        ])

    if (cargando) {
        return (
            <main className="mx-auto w-full max-w-5xl p-4 font-sans text-slate-800 sm:p-6 lg:p-10">
                <Loading mensaje="Cargando resumen financiero..." />
            </main>
        )
    }

    return (
        <main className="mx-auto w-full max-w-6xl p-4 font-sans text-slate-800 sm:p-6 lg:p-10">

            {/* ================================
                NOTIFICACIONES
            ================================= */}

            {mensaje && (
                <Notification
                    tipo="success"
                    mensaje={mensaje}
                    onClose={() =>
                        setMensaje('')
                    }
                />
            )}

            {error && (
                <Notification
                    tipo="error"
                    mensaje={error}
                    onClose={() =>
                        setError('')
                    }
                />
            )}

            {/* ================================
                ENCABEZADO
            ================================= */}

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                        Resumen financiero
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Consulta el estado actual de
                        las finanzas de tu hogar.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={actualizarDashboard}
                    disabled={procesando}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {procesando
                        ? 'Actualizando...'
                        : 'Actualizar'}
                </button>
            </div>

            {/* ================================
                TARJETAS RESUMEN
            ================================= */}

            <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {/* INGRESOS */}

                <div className="rounded-xl border border-green-100 bg-green-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-green-700">
                        Ingresos
                    </p>

                    <p className="mt-2 text-2xl font-bold text-green-700">
                        {formatearMoneda(
                            ingresos
                        )}
                    </p>
                </div>

                {/* REMESAS */}

                <div className="rounded-xl border border-violet-100 bg-violet-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-violet-700">
                        Remesas
                    </p>

                    <p className="mt-2 text-2xl font-bold text-violet-700">
                        {formatearMoneda(
                            remesas
                        )}
                    </p>
                </div>

                {/* GASTOS */}

                <div className="rounded-xl border border-red-100 bg-red-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-red-700">
                        Gastos
                    </p>

                    <p className="mt-2 text-2xl font-bold text-red-700">
                        {formatearMoneda(
                            gastos
                        )}
                    </p>
                </div>

                {/* BALANCE */}

                <div
                    className={`rounded-xl border p-5 shadow-sm ${
                        balance >= 0
                            ? 'border-blue-100 bg-blue-50'
                            : 'border-red-100 bg-red-50'
                    }`}
                >
                    <p
                        className={`text-sm font-medium ${
                            balance >= 0
                                ? 'text-blue-700'
                                : 'text-red-700'
                        }`}
                    >
                        Balance
                    </p>

                    <p
                        className={`mt-2 text-2xl font-bold ${
                            balance >= 0
                                ? 'text-blue-700'
                                : 'text-red-700'
                        }`}
                    >
                        {formatearMoneda(
                            balance
                        )}
                    </p>
                </div>
            </section>

            {/* ================================
                GRÁFICAS
            ================================= */}

            <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* GRÁFICA INGRESOS VS GASTOS */}

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-800">
                            Ingresos vs. gastos
                        </h2>

                        <p className="text-sm text-slate-500">
                            Comportamiento de los últimos
                            meses registrados.
                        </p>
                    </div>

                    {datosMensuales.length === 0 ? (
                        <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                            No hay datos suficientes
                            para mostrar la gráfica.
                        </div>
                    ) : (
                        <div className="h-72 w-full">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <BarChart
                                    data={
                                        datosMensuales
                                    }
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: 10,
                                        bottom: 10,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="mes"
                                    />

                                    <YAxis />

                                    <Tooltip
                                        formatter={(
                                            value
                                        ) =>
                                            formatearMoneda(
                                                value
                                            )
                                        }
                                    />

                                    <Legend />

                                    <Bar
                                        dataKey="ingresos"
                                        name="Ingresos"
                                        fill="#16a34a"
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0,
                                        ]}
                                    />

                                    <Bar
                                        dataKey="gastos"
                                        name="Gastos"
                                        fill="#dc2626"
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0,
                                        ]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* GRÁFICA GASTOS POR CATEGORÍA */}

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-800">
                            Gastos por categoría
                        </h2>

                        <p className="text-sm text-slate-500">
                            Distribución de los gastos
                            registrados.
                        </p>
                    </div>

                    {gastosPorCategoria.length ===
                    0 ? (
                        <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                            No hay gastos registrados
                            para mostrar.
                        </div>
                    ) : (
                        <div className="h-72 w-full">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <PieChart>
                                    <Pie
                                        data={
                                            gastosPorCategoria
                                        }
                                        dataKey="monto"
                                        nameKey="nombre"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        label
                                    >
                                        {gastosPorCategoria.map(
                                            (
                                                entrada,
                                                index
                                            ) => (
                                                <Cell
                                                    key={
                                                        entrada.nombre
                                                    }
                                                    fill={
                                                        COLORES_CATEGORIAS[
                                                            index %
                                                                COLORES_CATEGORIAS.length
                                                        ]
                                                    }
                                                />
                                            )
                                        )}
                                    </Pie>

                                    <Tooltip
                                        formatter={(
                                            value
                                        ) =>
                                            formatearMoneda(
                                                value
                                            )
                                        }
                                    />

                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </section>

            {/* ================================
                MOVIMIENTOS RECIENTES
            ================================= */}

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Movimientos recientes
                        </h2>

                        <p className="text-sm text-slate-500">
                            Últimos movimientos
                            registrados.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={actualizarDashboard}
                        disabled={procesando}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Actualizar
                    </button>
                </div>

                {movimientosRecientes.length ===
                0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                        No hay movimientos
                        registrados.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">

                            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">
                                        Fecha
                                    </th>

                                    <th className="px-5 py-3">
                                        Tipo
                                    </th>

                                    <th className="px-5 py-3">
                                        Descripción
                                    </th>

                                    <th className="px-5 py-3 text-right">
                                        Monto
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {movimientosRecientes.map(
                                    (
                                        movimiento
                                    ) => (
                                        <tr
                                            key={
                                                movimiento.idMovimiento
                                            }
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                {movimiento.fecha
                                                    ?.split(
                                                        'T'
                                                    )[0] ||
                                                    ''}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        movimiento.tipo ===
                                                        'Ingreso'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {movimiento.tipo ===
                                                    'Ingreso'
                                                        ? movimiento.origenEmisora
                                                            ? 'Remesa'
                                                            : 'Ingreso'
                                                        : 'Gasto'}
                                                </span>
                                            </td>

                                            <td className="max-w-xs px-5 py-4 text-slate-700">
                                                {movimiento.descripcion ||
                                                    'Sin descripción'}
                                            </td>

                                            <td
                                                className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                                                    movimiento.tipo ===
                                                    'Ingreso'
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                }`}
                                            >
                                                {movimiento.tipo ===
                                                'Ingreso'
                                                    ? '+'
                                                    : '-'}

                                                {formatearMoneda(
                                                    movimiento.monto
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )}

                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    )
}