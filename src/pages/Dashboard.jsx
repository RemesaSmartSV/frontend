import { useEffect, useState } from 'react'
import { movimientosApi } from '../services/api'
import './Dashboard.css'

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
            <main className="dashboard-container">
                <p>Cargando resumen financiero...</p>
            </main>
        )
    }

    return (
        <main className="dashboard-container">

            <div className="dashboard-header">

                <div>
                    <h1>Resumen financiero</h1>

                    <p>
                        Consulta el estado actual de las
                        finanzas de tu hogar.
                    </p>
                </div>

                <button
                    onClick={cargarMovimientos}
                    className="btn-actualizar"
                >
                    Actualizar
                </button>

            </div>

            {error && (
                <div className="mensaje-error">
                    {error}
                </div>
            )}

            <section className="resumen-grid">

                <div className="resumen-card ingresos">
                    <span>Ingresos</span>

                    <strong>
                        {formatearMonto(ingresos)}
                    </strong>

                    <small>
                        Total de ingresos
                    </small>
                </div>

                <div className="resumen-card remesas">
                    <span>Remesas</span>

                    <strong>
                        {formatearMonto(remesas)}
                    </strong>

                    <small>
                        Remesas recibidas
                    </small>
                </div>

                <div className="resumen-card gastos">
                    <span>Gastos</span>

                    <strong>
                        {formatearMonto(gastos)}
                    </strong>

                    <small>
                        Total de gastos
                    </small>
                </div>

                <div className="resumen-card balance">
                    <span>Balance</span>

                    <strong>
                        {formatearMonto(balance)}
                    </strong>

                    <small>
                        Ingresos - gastos
                    </small>
                </div>

            </section>

            <section className="movimientos-recientes">

                <div className="seccion-header">
                    <h2>Movimientos recientes</h2>
                </div>

                {movimientosRecientes.length === 0 ? (
                    <p className="sin-datos">
                        Todavía no hay movimientos registrados.
                    </p>
                ) : (

                    <div className="tabla-dashboard">

                        <table>

                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Descripción</th>
                                    <th>Monto</th>
                                </tr>
                            </thead>

                            <tbody>

                                {movimientosRecientes.map(
                                    (movimiento) => (

                                        <tr
                                            key={
                                                movimiento.idMovimiento
                                            }
                                        >

                                            <td>
                                                {new Date(
                                                    movimiento.fecha
                                                ).toLocaleDateString()}
                                            </td>

                                            <td>
                                                {movimiento.tipo ===
                                                    'Ingreso'
                                                    ? movimiento.origenEmisora
                                                        ? 'Remesa'
                                                        : 'Ingreso'
                                                    : 'Gasto'}
                                            </td>

                                            <td>
                                                {movimiento.descripcion ||
                                                    'Sin descripción'}
                                            </td>

                                            <td
                                                className={
                                                    movimiento.tipo ===
                                                        'Ingreso'
                                                        ? 'monto-ingreso'
                                                        : 'monto-gasto'
                                                }
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