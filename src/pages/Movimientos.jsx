import { useEffect, useState } from 'react'
import { categoriasApi, movimientosApi } from '../services/api'
import './Movimientos.css'

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
        <div className="movimientos-container">
            <h1>Movimientos financieros</h1>

            <p className="subtitulo">
                Registra tus ingresos, remesas y gastos familiares.
            </p>

            {error && <div className="mensaje-error">{error}</div>}

            <section className="formulario-card">
                <h2>
                    {editandoId ? 'Editar movimiento' : 'Registrar movimiento'}
                </h2>

                <form onSubmit={guardarMovimiento}>
                    <div className="form-grid">

                        <div className="campo">
                            <label>Tipo</label>

                            <select
                                name="tipo"
                                value={formulario.tipo}
                                onChange={manejarCambio}
                            >
                                <option value="Ingreso">Ingreso / Remesa</option>
                                <option value="Gasto">Gasto</option>
                            </select>
                        </div>

                        <div className="campo">
                            <label>Categoría</label>

                            <select
                                name="idCategoria"
                                value={formulario.idCategoria}
                                onChange={manejarCambio}
                            >
                                <option value="">Selecciona una categoría</option>

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

                        <div className="campo">
                            <label>Origen / Emisora</label>

                            <input
                                type="text"
                                name="origenEmisora"
                                value={formulario.origenEmisora}
                                onChange={manejarCambio}
                                placeholder="Ej. Estados Unidos"
                            />
                        </div>

                        <div className="campo campo-completo">
                            <label>Descripción</label>

                            <input
                                type="text"
                                name="descripcion"
                                value={formulario.descripcion}
                                onChange={manejarCambio}
                                placeholder="Descripción del movimiento"
                            />
                        </div>

                    </div>

                    <div className="botones-formulario">
                        <button type="submit" className="btn-guardar">
                            {editandoId ? 'Actualizar' : 'Guardar'}
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
                <div className="lista-header">
                    <h2>Movimientos registrados</h2>

                    <button onClick={cargarDatos} className="btn-recargar">
                        Actualizar
                    </button>
                </div>

                {cargando ? (
                    <p>Cargando movimientos...</p>
                ) : movimientos.length === 0 ? (
                    <p className="sin-datos">
                        No hay movimientos registrados.
                    </p>
                ) : (
                    <div className="tabla-contenedor">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Categoría</th>
                                    <th>Monto</th>
                                    <th>Descripción</th>
                                    <th>Origen</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {movimientos.map((movimiento) => {
                                    const categoria = categorias.find(
                                        (c) =>
                                            c.idCategoria === movimiento.idCategoria
                                    )

                                    return (
                                        <tr key={movimiento.idMovimiento}>
                                            <td>
                                                {new Date(
                                                    movimiento.fecha
                                                ).toLocaleDateString()}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        movimiento.tipo === 'Ingreso'
                                                            ? 'tipo-ingreso'
                                                            : 'tipo-gasto'
                                                    }
                                                >
                                                    {movimiento.tipo}
                                                </span>
                                            </td>

                                            <td>
                                                {categoria?.nombre || 'Sin categoría'}
                                            </td>

                                            <td>
                                                ${Number(movimiento.monto).toFixed(2)}
                                            </td>

                                            <td>
                                                {movimiento.descripcion || '-'}
                                            </td>

                                            <td>
                                                {movimiento.origenEmisora || '-'}
                                            </td>

                                            <td className="acciones">
                                                <button
                                                    onClick={() =>
                                                        editarMovimiento(movimiento)
                                                    }
                                                    className="btn-editar"
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        eliminarMovimiento(
                                                            movimiento.idMovimiento
                                                        )
                                                    }
                                                    className="btn-eliminar"
                                                >
                                                    Eliminar
                                                </button>
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