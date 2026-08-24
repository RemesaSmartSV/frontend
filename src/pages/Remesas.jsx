import { useEffect, useState } from 'react'
import { categoriasApi, movimientosApi } from '../services/api'
import './Remesas.css'

export default function Remesas() {
    const [remesas, setRemesas] = useState([])
    const [categorias, setCategorias] = useState([])

    const [formulario, setFormulario] = useState({
        idCategoria: '',
        monto: '',
        fecha: '',
        origenEmisora: '',
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

            const remesasFiltradas = movimientosData.filter(
                (movimiento) =>
                    movimiento.tipo === 'Ingreso' &&
                    movimiento.origenEmisora
            )

            setRemesas(remesasFiltradas)
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

    async function guardarRemesa(e) {
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

        if (!formulario.origenEmisora.trim()) {
            setError('Indica el origen o emisora de la remesa.')
            return
        }

        try {
            setError('')
            setMensaje('')

            const movimiento = {
                idCategoria: Number(formulario.idCategoria),
                monto: Number(formulario.monto),
                fecha: formulario.fecha,
                tipo: 'Ingreso',
                descripcion: formulario.descripcion,
                origenEmisora: formulario.origenEmisora,
            }

            if (editandoId) {
                await movimientosApi.actualizar(
                    editandoId,
                    movimiento
                )

                setMensaje('Remesa actualizada correctamente.')
            } else {
                await movimientosApi.crear(movimiento)

                setMensaje('Remesa registrada correctamente.')
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (err) {
            setError(err.message)
        }
    }

    function editarRemesa(remesa) {
        setEditandoId(remesa.idMovimiento)

        setFormulario({
            idCategoria: remesa.idCategoria,
            monto: remesa.monto,
            fecha: remesa.fecha?.split('T')[0] || '',
            origenEmisora: remesa.origenEmisora || '',
            descripcion: remesa.descripcion || '',
        })

        setError('')
        setMensaje('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    async function eliminarRemesa(id) {
        const confirmar = window.confirm(
            '¿Seguro que deseas eliminar esta remesa?'
        )

        if (!confirmar) {
            return
        }

        try {
            setError('')
            setMensaje('')

            await movimientosApi.eliminar(id)

            setMensaje('Remesa eliminada correctamente.')
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
            origenEmisora: '',
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
        <main className="remesas-container">
            <div className="remesas-header">
                <div>
                    <h1>Remesas</h1>

                    <p>
                        Registra y administra las remesas
                        recibidas por tu hogar.
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
                        ? 'Editar remesa'
                        : 'Registrar remesa'}
                </h2>

                <form onSubmit={guardarRemesa}>
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
                                            'Ingreso'
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
                                placeholder="Descripción de la remesa"
                            />
                        </div>

                    </div>

                    <div className="botones-formulario">
                        <button
                            type="submit"
                            className="btn-guardar"
                        >
                            {editandoId
                                ? 'Actualizar remesa'
                                : 'Guardar remesa'}
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
                <h2>Remesas registradas</h2>

                {cargando ? (
                    <p>Cargando remesas...</p>
                ) : remesas.length === 0 ? (
                    <p className="sin-datos">
                        No hay remesas registradas.
                    </p>
                ) : (
                    <div className="tabla-contenedor">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Origen</th>
                                    <th>Categoría</th>
                                    <th>Monto</th>
                                    <th>Descripción</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {remesas.map((remesa) => (
                                    <tr
                                        key={
                                            remesa.idMovimiento
                                        }
                                    >
                                        <td>
                                            {new Date(
                                                remesa.fecha
                                            ).toLocaleDateString()}
                                        </td>

                                        <td>
                                            {
                                                remesa.origenEmisora
                                            }
                                        </td>

                                        <td>
                                            {obtenerNombreCategoria(
                                                remesa.idCategoria
                                            )}
                                        </td>

                                        <td className="monto-remesa">
                                            +$
                                            {Number(
                                                remesa.monto
                                            ).toFixed(2)}
                                        </td>

                                        <td>
                                            {remesa.descripcion ||
                                                '-'}
                                        </td>

                                        <td className="acciones">
                                            <button
                                                onClick={() =>
                                                    editarRemesa(
                                                        remesa
                                                    )
                                                }
                                                className="btn-editar"
                                            >
                                                Editar
                                            </button>

                                            <button
                                                onClick={() =>
                                                    eliminarRemesa(
                                                        remesa.idMovimiento
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