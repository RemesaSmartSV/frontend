import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
    ahorroApi,
    alertasApi,
} from '../services/api'

import Notification from '../components/Notification'
import Loading from '../components/Loading'
import { formatearMoneda, formatearNumero, formatearFecha, obtenerLocale, parsearFechaLocal } from '../utils/formato'

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

function nombreMes(anio, mes, idioma) {
    const fecha = new Date(anio, mes - 1, 1)

    return fecha.toLocaleDateString(obtenerLocale(idioma), {
        month: 'long',
        year: 'numeric',
    })
}

export default function Dashboard() {
    const { t, i18n } = useTranslation()
    const hoy = new Date()

    const [movimientos, setMovimientos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [resumen, setResumen] = useState({
        totalIngresos: 0,
        totalGastos: 0,
        balance: 0,
    })
    const [metas, setMetas] = useState([])
    const [alertas, setAlertas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)

    // Periodo de los KPIs: 'historial' conserva el comportamiento anterior de
    // totales acumulados; 'mes' filtra resumen y remesas al mes seleccionado.
    const [modoPeriodo, setModoPeriodo] = useState('historial')
    const [anio, setAnio] = useState(hoy.getFullYear())
    const [mes, setMes] = useState(hoy.getMonth() + 1)

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true)
            setError('')

            const filtroMes =
                modoPeriodo === 'mes'
                    ? { anio, mes }
                    : {}

            // Ahorro y alertas son complementarios: si uno falla, el dashboard
            // sigue mostrando el resto (promesa propia con catch).
            const [
                data,
                resumenData,
                categoriasData,
                metasData,
                alertasData,
            ] = await Promise.all([
                movimientosApi.listar(),
                movimientosApi.resumen(filtroMes.anio, filtroMes.mes),
                categoriasApi.listar(),
                ahorroApi.listarMetas().catch(() => []),
                alertasApi
                    .listarPorPeriodo(
                        new Date(anio, mes - 1, 1),
                        new Date(anio, mes, 0)
                    )
                    .catch(() => []),
            ])

            setMovimientos(data)
            setResumen(resumenData)
            setCategorias(
                Array.isArray(categoriasData) ? categoriasData : []
            )
            setMetas(Array.isArray(metasData) ? metasData : [])
            setAlertas(Array.isArray(alertasData) ? alertasData : [])
        } catch (err) {
            setError(
                err.message ||
                t('dashboard.loadError')
            )
        } finally {
            setCargando(false)
        }
    }, [modoPeriodo, anio, mes, t])

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
                t('dashboard.updated')
            )
        } catch (err) {
            setError(err.message)
        } finally {
            setProcesando(false)
        }
    }, [cargarDatos, t])

    // Todos los ingresos, incluyendo las remesas
    const ingresos = Number(resumen.totalIngresos || 0)

    // Todos los gastos
    const gastos = Number(resumen.totalGastos || 0)

    const remesas = useMemo(() => {
        return movimientos
            .filter(
                (m) =>
                    m.tipo === 'Ingreso' &&
                    m.origenEmisora
            )
            .filter((m) => {
                if (modoPeriodo !== 'mes') {
                    return true
                }

                const fecha = parsearFechaLocal(m.fecha)

                return (
                    fecha !== null &&
                    !Number.isNaN(fecha.getTime()) &&
                    fecha.getFullYear() === anio &&
                    fecha.getMonth() + 1 === mes
                )
            })
            .reduce(
                (total, m) =>
                    total + Number(m.monto || 0),
                0
            )
    }, [movimientos, modoPeriodo, anio, mes])

    // Ahorro consolidado de las metas del hogar (saldo actual, no flujo).
    const ahorroTotal = useMemo(() => {
        return metas.reduce(
            (total, meta) => total + Number(meta.montoActual || 0),
            0
        )
    }, [metas])

    function cambiarMes(direccion) {
        const nuevo = new Date(anio, mes - 1 + direccion, 1)

        setAnio(nuevo.getFullYear())
        setMes(nuevo.getMonth() + 1)
    }

    // Balance
    const balance = Number(resumen.balance || ingresos - gastos)

    const movimientosRecientes = useMemo(() => {
        return [...movimientos]
            .filter((movimiento) => {
                return (
                    parsearFechaLocal(movimiento.fecha) !== null
                )
            })
            .sort((a, b) => {
                return (
                    parsearFechaLocal(b.fecha) -
                    parsearFechaLocal(a.fecha)
                )
            })
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
            const fecha = parsearFechaLocal(movimiento.fecha)

            if (!fecha || Number.isNaN(fecha.getTime())) {
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
                        obtenerLocale(i18n.language),
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
    }, [movimientos, i18n.language])

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

                return categoria?.nombre || t('dashboard.noCategory')
            },
            [categorias, t]
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
                <Loading mensaje={t('dashboard.loading')} />
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
                        {t('dashboard.titulo')}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        {t('dashboard.subtitulo')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                        <button
                            type="button"
                            onClick={() => cambiarMes(-1)}
                            aria-label={t('dashboard.mesAnterior')}
                            className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                        >
                            ‹
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setModoPeriodo(
                                    modoPeriodo === 'mes'
                                        ? 'historial'
                                        : 'mes'
                                )
                            }
                            aria-pressed={modoPeriodo === 'mes'}
                            className="rounded-md px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                            {modoPeriodo === 'mes'
                                ? nombreMes(anio, mes, i18n.language)
                                : t('dashboard.todoHistorial')}
                        </button>

                        <button
                            type="button"
                            onClick={() => cambiarMes(1)}
                            aria-label={t('dashboard.mesSiguiente')}
                            className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                        >
                            ›
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={actualizarDashboard}
                        disabled={procesando}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {procesando
                            ? t('common.procesando')
                            : t('common.actualizar')}
                    </button>
                </div>
            </div>

            {/* ================================
                TARJETAS RESUMEN
            ================================= */}

            <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                {/* INGRESOS */}

                <div className="rounded-xl border border-green-100 bg-green-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-green-700">
                        {t('dashboard.ingresos')}
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
                        {t('dashboard.remesas')}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-violet-700">
                        {formatearMoneda(
                            remesas
                        )}
                    </p>
                </div>

                {/* AHORRO */}

                <div className="rounded-xl border border-teal-100 bg-teal-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-teal-700">
                        {t('dashboard.ahorro')}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-teal-700">
                        {formatearMoneda(
                            ahorroTotal
                        )}
                    </p>
                </div>

                {/* GASTOS */}

                <div className="rounded-xl border border-red-100 bg-red-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-red-700">
                        {t('dashboard.gastos')}
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
                        {t('dashboard.balance')}
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
                            {t('dashboard.ingresos')} vs. {t('dashboard.gastos')}
                        </h2>

                        <p className="text-sm text-slate-500">
                            {t('dashboard.lastMonths')}
                        </p>
                    </div>

                    {datosMensuales.length === 0 ? (
                        <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                            {t('dashboard.insufficientChartData')}
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

                                    <YAxis tickFormatter={(value) => formatearNumero(value)} />

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
                                        name={t('dashboard.ingresos')}
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
                                        name={t('dashboard.gastos')}
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
                            {t('dashboard.gastos')} / {t('nav.categorias')}
                        </h2>

                        <p className="text-sm text-slate-500">
                            {t('dashboard.expenseDistribution')}
                        </p>
                    </div>

                    {gastosPorCategoria.length ===
                    0 ? (
                        <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                            {t('dashboard.noExpensesChart')}
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
                ALERTAS DE PRESUPUESTO
            ================================= */}

            {alertas.length > 0 && (
                <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-slate-800">
                        ⚠️ {t('dashboard.alertas')}
                    </h2>

                    <ul className="space-y-3">
                        {alertas.map((alerta, indice) => {
                            const esCritica =
                                alerta.tipoAlerta === 'Crítico'

                            return (
                                <li
                                    key={`alerta-${indice}`}
                                    className={`rounded-lg border-l-4 p-3 ${
                                        esCritica
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-amber-500 bg-amber-50'
                                    }`}
                                >
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <strong className={`text-xs uppercase ${
                                            esCritica
                                                ? 'text-red-700'
                                                : 'text-amber-700'
                                        }`}>
                                            {alerta.tipoAlerta === 'Crítico' ? t('dashboard.critical') : t('dashboard.warning')}
                                        </strong>

                                        <span className="text-xs font-semibold text-gray-600">
                                            {alerta.porcentajeUsado}%
                                        </span>
                                    </div>

                                    <p className="text-sm leading-5 text-gray-700">
                                        {alerta.mensaje}
                                    </p>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            )}

            {/* ================================
                METAS DE AHORRO
            ================================= */}

            <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-slate-800">
                        🐷 {t('dashboard.metas')}
                    </h2>

                    <a
                        href="/ahorro"
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                        {t('dashboard.allGoals')}
                    </a>
                </div>

                {metas.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-500">
                        {t('dashboard.noGoals')}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {metas.slice(0, 3).map((meta) => {
                            const objetivo =
                                Number(meta.montoObjetivo || 0)
                            const actual =
                                Number(meta.montoActual || 0)
                            const porcentaje = objetivo > 0
                                ? (actual / objetivo) * 100
                                : 0
                            const barra = Math.min(
                                Math.max(porcentaje, 0),
                                100
                            )

                            return (
                                <div
                                    key={meta.idMeta}
                                    className="rounded-lg border border-slate-100 p-4"
                                >
                                    <p className="truncate font-medium text-slate-800">
                                        {meta.titulo}
                                    </p>

                                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                        <div
                                            className="h-full rounded-full bg-green-500 transition-all duration-500"
                                            style={{
                                                width: `${barra}%`,
                                            }}
                                        />
                                    </div>

                                    <p className="mt-2 text-sm text-slate-500">
                                        {formatearNumero(porcentaje, { maximumFractionDigits: 0 })}% ·{' '}
                                        {formatearMoneda(actual)} de{' '}
                                        {formatearMoneda(objetivo)}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* ================================
                MOVIMIENTOS RECIENTES
            ================================= */}

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {t('dashboard.movimientosRecientes')}
                        </h2>

                        <p className="text-sm text-slate-500">
                            {t('dashboard.lastTransactions')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={actualizarDashboard}
                        disabled={procesando}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {t('common.actualizar')}
                    </button>
                </div>

                {movimientosRecientes.length ===
                0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                        {t('dashboard.noTransactions')}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">

                            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">
                                        {t('dashboard.transactionDate')}
                                    </th>

                                    <th className="px-5 py-3">
                                        {t('dashboard.transactionType')}
                                    </th>

                                    <th className="px-5 py-3">
                                        {t('dashboard.transactionDescription')}
                                    </th>

                                    <th className="px-5 py-3 text-right">
                                        {t('dashboard.transactionAmount')}
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
                                                {movimiento.fecha ? formatearFecha(movimiento.fecha) : ''}
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
                                                            ? t('nav.remesas')
                                                            : t('nav.ingresos')
                                                        : t('nav.gastos')}
                                                </span>
                                            </td>

                                            <td className="max-w-xs px-5 py-4 text-slate-700">
                                                {movimiento.descripcion ||
                                                    t('dashboard.noDescription')}
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
