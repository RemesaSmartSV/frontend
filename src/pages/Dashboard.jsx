import { useEffect, useState } from 'react'
import { movimientosApi } from '../services/api'
import Notification from '../components/Notification'
import Loading from '../components/Loading'

export default function Dashboard() {
    const [movimientos, setMovimientos] = useState([])
    const [resumen, setResumen] = useState({
        totalIngresos: 0,
        totalGastos: 0,
        balance: 0,
    })
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    useEffect(() => {
        cargarMovimientos()
    }, [])

    async function cargarMovimientos() {
        try {
            setCargando(true)
            setError('')

            const [data, resumenData] = await Promise.all([
                movimientosApi.listar(),
                movimientosApi.resumen(),
            ])

            setMovimientos(data)
            setResumen(resumenData)
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    async function actualizarDashboard() {
        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            await cargarMovimientos()

            setMensaje(
                'Resumen financiero actualizado correctamente.'
            )
        } catch (err) {
            setError(err.message)
        } finally {
            setProcesando(false)
        }
    }

    // Todos los ingresos, incluyendo las remesas
    const ingresos = Number(resumen.totalIngresos || 0)

    // Todos los gastos
    const gastos = Number(resumen.totalGastos || 0)

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
    const balance = Number(resumen.balance || ingresos - gastos)

    // Últimos 5 movimientos
    const movimientosRecientes = [...movimientos]
        .sort(
            (a, b) =>
                new Date(b.fecha) -
                new Date(a.fecha)
        )
        .slice(0, 5)

    function formatearMonto(monto) {
        return `$${Number(monto).toFixed(2)}`
    }

    if (cargando) {
        return (
            <main className="mx-auto w-full max-w-5xl p-4 font-sans text-slate-800 sm:p-6 lg:p-10">
                <Loading mensaje="Cargando resumen financiero..." />
            </main>
        )
    }

    return (
        <main className="mx-auto w-full max-w-5xl p-4 font-sans text-slate-800 sm:p-6 lg:p-10">

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
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0">
                    <h1 className="mb-1 text-2xl font-bold text-slate-900 sm:text-[2rem]">
                        Resumen financiero
                    </h1>

                    <p className="text-sm leading-6 text-gray-500 sm:text-[0.95rem]">
                        Consulta el estado actual de las
                        finanzas de tu hogar.
                    </p>
                </div>

                <button
                    onClick={actualizarDashboard}
                    disabled={procesando || cargando}
                    className="w-full rounded-[10px] bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(37,99,235,0.2)] transition hover:-translate-y-px hover:bg-blue-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:shrink-0"
                >
                    {procesando
                        ? 'Actualizando...'
                        : 'Actualizar'}
                </button>

            </div>

            {/* TARJETAS DE RESUMEN */}
            <section className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">

                {/* INGRESOS */}
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_4px_15px_rgba(15,23,42,0.06)] transition hover:-translate-y-[3px] hover:shadow-[0_8px_22px_rgba(15,23,42,0.1)]">

                    <div className="absolute left-0 top-0 h-full w-1 bg-green-600"></div>

                    <span className="mb-3 block text-sm font-semibold text-slate-500">
                        Ingresos
                    </span>

                    <strong className="mb-2 block break-words text-2xl font-bold text-green-600 sm:text-3xl">
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

                    <strong className="mb-2 block break-words text-2xl font-bold text-violet-600 sm:text-3xl">
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

                    <strong className="mb-2 block break-words text-2xl font-bold text-red-600 sm:text-3xl">
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

                    <strong
                        className={`mb-2 block break-words text-2xl font-bold sm:text-3xl ${balance >= 0
                                ? 'text-blue-600'
                                : 'text-red-600'
                            }`}
                    >
                        {formatearMonto(balance)}
                    </strong>

                    <small className="text-[0.82rem] text-slate-400">
                        Ingresos - gastos
                    </small>

                </div>

            </section>

            {/* MOVIMIENTOS RECIENTES */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_4px_15px_rgba(15,23,42,0.06)] sm:p-6 lg:p-7">

                <div className="mb-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold text-slate-900">
                            Movimientos recientes
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Últimos movimientos registrados.
                        </p>
                    </div>

                    <button
                        onClick={actualizarDashboard}
                        disabled={procesando}
                        className="w-full rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:shrink-0"
                    >
                        {procesando
                            ? 'Actualizando...'
                            : 'Actualizar'}
                    </button>

                </div>

                {movimientosRecientes.length === 0 ? (

                    <p className="p-6 text-center text-sm text-slate-500 sm:p-8">
                        Todavía no hay movimientos registrados.
                    </p>

                ) : (

                    <div className="w-full overflow-x-auto">

                        <table className="w-full min-w-[600px] border-collapse">

                            <thead>
                                <tr>

                                    <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-3.5">
                                        Fecha
                                    </th>

                                    <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-3.5">
                                        Tipo
                                    </th>

                                    <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-3.5">
                                        Descripción
                                    </th>

                                    <th className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-3.5">
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

                                            <td className="whitespace-nowrap border-b border-slate-100 px-3 py-4 text-sm text-slate-700 sm:px-3.5">
                                                {new Date(
                                                    movimiento.fecha
                                                ).toLocaleDateString()}
                                            </td>

                                            <td className="whitespace-nowrap border-b border-slate-100 px-3 py-4 text-sm text-slate-700 sm:px-3.5">

                                                {movimiento.tipo ===
                                                    'Ingreso'
                                                    ? movimiento.origenEmisora
                                                        ? 'Remesa'
                                                        : 'Ingreso'
                                                    : 'Gasto'}

                                            </td>

                                            <td className="max-w-[280px] border-b border-slate-100 px-3 py-4 text-sm text-slate-700 sm:px-3.5">
                                                <span className="block break-words">
                                                    {movimiento.descripcion ||
                                                        'Sin descripción'}
                                                </span>
                                            </td>

                                            <td
                                                className={`whitespace-nowrap border-b border-slate-100 px-3 py-4 text-sm font-bold sm:px-3.5 ${movimiento.tipo ===
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