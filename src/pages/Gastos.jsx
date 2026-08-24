import { useEffect, useState } from 'react'
import { categoriasApi, movimientosApi } from '../services/api'
import './Gastos.css'

export default function Gastos() {
    const [gastos, setGastos] = useState([])
    const [categorias, setCategorias] = useState([])

    const [formulario, setFormulario] = useState({
        idCategoria: '',
        monto: '',
        fecha: '',
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

            const gastosFiltrados = movimientosData.filter(
                (movimiento) => movimiento.tipo === 'Gasto'
            )

            setGastos(gastosFiltrados)
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

    async function guardarGasto(e) {
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
            setMensaje('')

            const movimiento = {
                idCategoria: Number(formulario.idCategoria),
                monto: Number(formulario.monto),
                fecha: formulario.fecha,
                tipo: 'Gasto',
                descripcion: formulario.descripcion,
                origenEmisora: '',
            }

            if (editandoId) {
                await movimientosApi.actualizar(
                    editandoId,
                    movimiento
                )

                setMensaje('Gasto actualizado correctamente.')
            } else {
                await movimientosApi.crear(movimiento)

                setMensaje('Gasto registrado correctamente.')
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (err) {
            setError(err.message)
        }
    }

    function editarGasto(gasto) {
        setEditandoId(gasto.idMovimiento)

        setFormulario({
            idCategoria: gasto.idCategoria,
            monto: gasto.monto,
            fecha: gasto.fecha?.split('T')[0] || '',
            descripcion: gasto.descripcion || '',
        })

        setError('')
        setMensaje('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    async function eliminarGasto(id) {
        const confirmar = window.confirm(
            '¿Seguro que deseas eliminar este gasto?'
        )

        if (!confirmar) {
            return
        }

        try {
            setError('')
            setMensaje('')

            await movimientosApi.eliminar(id)

            setMensaje('Gasto eliminado correctamente.')
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
        <main className="gastos-container">

            <div className="gastos-header">
                <div>
                    <h1>Gastos</h1>

                    <p>
                        Registra y administra los gastos
                        realizados por tu hogar.
                    </p>
                </div>

                <button
                    onClick={cargarDatos}
                    className="btn-recargar"
                >
                    Actualizar
                </button>
            </div>

            {error && (
                <div className="mensaje-error">
                    {error}
                </div>
            )}

            {mensaje && (
                <div className="mensaje-exito">
                    {mensaje}
                </div>
            )}

            <section className="formulario-card">

                <h2>
                    {editandoId
                        ? 'Editar gasto'
                        : 'Registrar gasto'}
                </h2>

                <form onSubmit={guardarGasto}>

                    <div className="form-grid">

                        <div className="campo">
                            <label>Categoría</label>

                            <select
                                name="idCategoria"
                                value={formulario.idCategoria}
                                onChange={manejarCambio}
                            >
                                <option value="">
                                    Selecciona una categoría
                                </option>

                                {categorias
                                    .filter(
                                        (categoria) =>
                                            categoria.tipo ===
                                            'Gasto'
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

                        <div className="campo">
                            <label>Monto</label>

                            <input
                                type="number"
                                name="monto"
                                min="0"
                                step="0.01"
                                value={formulario.monto}
                                onChange={manejarCambio}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="campo">
                            <label>Fecha</label>

                            <input
                                type="date"
                                name="fecha"
                                value={formulario.fecha}
                                onChange={manejarCambio}
                            />
                        </div>

                        <div className="campo campo-completo">
                            <label>Descripción</label>

                            <input
                                type="text"
                                name="descripcion"
                                value={formulario.descripcion}
                                onChange={manejarCambio}
                                placeholder="Ej. Compra de alimentos"
                            />
                        </div>

                    </div>

                    <div className="botones-formulario">

                        <button
                            type="submit"
                            className="btn-guardar"
                        >
                            {editandoId
                                ? 'Actualizar gasto'
                                : 'Guardar gasto'}
                        </button>

                        {editandoId && (
                            <button
                                type="button"
                                className="btn-cancelar"
                                onClick={limpiarFormulario}
                            >
                                Cancelar
                            </button>
                        )}

                    </div>

                </form>

            </section>

            <section className="lista-card">

                <h2>Gastos registrados</h2>

                {cargando ? (
                    <p>Cargando gastos...</p>
                ) : gastos.length === 0 ? (
                    <p className="sin-datos">
                        No hay gastos registrados.
                    </p>
                ) : (

                    <div className="tabla-contenedor">

                        <table>

                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Categoría</th>
                                    <th>Monto</th>
                                    <th>Descripción</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>

                            <tbody>

                                {gastos.map((gasto) => (

                                    <tr
                                        key={
                                            gasto.idMovimiento
                                        }
                                    >

                                        <td>
                                            {new Date(
                                                gasto.fecha
                                            ).toLocaleDateString()}
                                        </td>

                                        <td>
                                            {obtenerNombreCategoria(
                                                gasto.idCategoria
                                            )}
                                        </td>

                                        <td className="monto-gasto">
                                            -$
                                            {Number(
                                                gasto.monto
                                            ).toFixed(2)}
                                        </td>

                                        <td>
                                            {gasto.descripcion ||
                                                '-'}
                                        </td>

                                        <td className="acciones">

                                            <button
                                                onClick={() =>
                                                    editarGasto(
                                                        gasto
                                                    )
                                                }
                                                className="btn-editar"
                                            >
                                                Editar
                                            </button>

                                            <button
                                                onClick={() =>
                                                    eliminarGasto(
                                                        gasto.idMovimiento
                                                    )
                                                }
                                                className="btn-eliminar"
                                            >
                                                Eliminar
                                            </button>

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