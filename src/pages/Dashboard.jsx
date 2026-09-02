import { useEffect, useState } from 'react'
import { movimientosApi } from '../services/api'

export default function Dashboard() {
    const [movimientos, setMovimientos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        cargarMovimientos()
    }, [])

    async function cargarMovimientos() {
        try {
            setCargando(true)
            setError('')

            const data = await movimientosApi.listar()
            setMovimientos(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    // Todos los ingresos, incluyendo las remesas
    const ingresos = movimientos
        .filter((movimiento) => movimiento.tipo === 'Ingreso')
        .reduce(
            (total, movimiento) =>
                total + Number(movimiento.monto),
            0
        )

    // Gastos
    const gastos = movimientos
        .filter((movimiento) => movimiento.tipo === 'Gasto')
        .reduce(
            (total, movimiento) =>
                total + Number(movimiento.monto),
            0
        )

    // Solo remesas
    const remesas = movimientos
        .filter(
            (movimiento) =>
                movimiento.tipo === 'Ingreso' &&
                movimiento.origenEmisora
        )
        .reduce(
            (total, movimiento) =>
                total + Number(movimiento.monto),
            0
        )

    // Balance
    const balance = ingresos - gastos

    // Últimos 5 movimientos
    const movimientosRecientes = [...movimientos]
        .sort(
            (a, b) =>
                new Date(b.fecha) - new Date(a.fecha)
        )
        .slice(0, 5)

    function formatearMonto(monto) {
        return `$${Number(monto).toFixed(2)}`
    }

    if (cargando) {
        return (
            <main className="mx-auto max-w-5xl p-5 font-sans text-slate-800 sm:p-10">
                <p>Cargando resumen financiero...</p>
            </main>
        )
    }

    return (
        <main className="mx-auto max-w-5xl p-5 font-sans text-slate-800 sm:p-10">

            {/* ENCABEZADO */}
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                    <h1 className="mb-1 text-2xl font-bold text-slate-900 sm:text-[2rem]">
                        Resumen financiero
                    </h1>

                    <p className="text-[0.95rem] text-gray-500">
                        Consulta el estado actual de las
                        finanzas de tu hogar.
                    </p>
                </div>

                <button
                    onClick={cargarMovimientos}
                    className="w-full rounded-[10px] bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(37,99,235,0.2)] transition hover:-translate-y-px hover:bg-blue-700 active:translate-y-0 sm:w-auto"
                >
                    Actualizar
                </button>

            </div>

            {/* MENSAJE DE ERROR */}
            {error && (
                <div className="mb-5 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* TARJETAS DE RESUMEN */}
            <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

                {/* INGRESOS */}
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_4px_15px_rgba(15,23,42,0.06)] transition hover:-translate-y-[3px] hover:shadow-[0_8px_22px_rgba(15,23,42,0.1)]">
                    <div className="absolute left-0 top-0 h-full w-1 bg-green-600"></div>

                    <span className="mb-3 block text-sm font-semibold text-slate-500">
                        Ingresos
                    </span>

                    <strong className="mb-2 block text-3xl font-bold text-green-600">
                        {formatearMonto(ingresos)}
                    </strong>

                    <small className="text-[0.82rem] text-slate-400">
                        Total de ingresos
                    </small>
                </div>

                {/* REMESAS */}
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_4px_15px_rgba(15,23,42,0.06)] transition hover:-translate-y-[3px] hover:shadow-[0_8px_22px_rgba(15,23,42,0.1)]">
                    <div className="absolute left-0 top-0 h-full w-1 bg-violet-600"></div>

                    <span className="mb-3 block text-sm font-semibold text-slate-500">
                        Remesas
                    </span>

                    <strong className="mb-2 block text-3xl font-bold text-violet-600">
                        {formatearMonto(remesas)}
                    </strong>

                    <small className="text-[0.82rem] text-slate-400">
                        Remesas recibidas
                    </small>
                </div>

                {/* GASTOS */}
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_4px_15px_rgba(15,23,42,0.06)] transition hover:-translate-y-[3px] hover:shadow-[0_8px_22px_rgba(15,23,42,0.1)]">
                    <div className="absolute left-0 top-0 h-full w-1 bg-red-600"></div>

                    <span className="mb-3 block text-sm font-semibold text-slate-500">
                        Gastos
                    </span>

                    <strong className="mb-2 block text-3xl font-bold text-red-600">
                        {formatearMonto(gastos)}
                    </strong>

                    <small className="text-[0.82rem] text-slate-400">
                        Total de gastos
                    </small>
                </div>

                {/* BALANCE */}
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_4px_15px_rgba(15,23,42,0.06)] transition hover:-translate-y-[3px] hover:shadow-[0_8px_22px_rgba(15,23,42,0.1)]">
                    <div className="absolute left-0 top-0 h-full w-1 bg-blue-600"></div>

                    <span className="mb-3 block text-sm font-semibold text-slate-500">
                        Balance
                    </span>

                    <strong className="mb-2 block text-3xl font-bold text-blue-600">
                        {formatearMonto(balance)}
                    </strong>

                    <small className="text-[0.82rem] text-slate-400">
                        Ingresos - gastos
                    </small>
                </div>

            </section>

            {/* MOVIMIENTOS RECIENTES */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_4px_15px_rgba(15,23,42,0.06)] sm:p-7">

                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Movimientos recientes
                    </h2>
                </div>

                {movimientosRecientes.length === 0 ? (
                    <p className="p-8 text-center text-slate-500">
                        Todavía no hay movimientos registrados.
                    </p>
                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full border-collapse">

                            <thead>
                                <tr>
                                    <th className="border-b border-slate-200 bg-slate-50 px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Fecha
                                    </th>

                                    <th className="border-b border-slate-200 bg-slate-50 px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Tipo
                                    </th>

                                    <th className="border-b border-slate-200 bg-slate-50 px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Descripción
                                    </th>

                                    <th className="border-b border-slate-200 bg-slate-50 px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Monto
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {movimientosRecientes.map(
                                    (movimiento) => (

                                        <tr
                                            key={
                                                movimiento.idMovimiento
                                            }
                                            className="transition hover:bg-slate-50"
                                        >

                                            <td className="border-b border-slate-100 px-3.5 py-4 text-sm text-slate-700">
                                                {new Date(
                                                    movimiento.fecha
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="border-b border-slate-100 px-3.5 py-4 text-sm text-slate-700">
                                                {movimiento.tipo ===
                                                    'Ingreso'
                                                    ? movimiento.origenEmisora
                                                        ? 'Remesa'
                                                        : 'Ingreso'
                                                    : 'Gasto'}
                                            </td>

                                            <td className="border-b border-slate-100 px-3.5 py-4 text-sm text-slate-700">
                                                {movimiento.descripcion ||
                                                    'Sin descripción'}
                                            </td>

                                            <td
                                                className={`border-b border-slate-100 px-3.5 py-4 text-sm font-bold ${movimiento.tipo ===
                                                        'Ingreso'
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}
                                            >
                                                {movimiento.tipo ===
                                                    'Ingreso'
                                                    ? '+ '
                                                    : '- '}

                                                {formatearMonto(
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