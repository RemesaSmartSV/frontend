import { useEffect, useState } from 'react'
import { categoriasApi, movimientosApi } from '../services/api'
import './Ingresos.css'

export default function Ingresos() {
    const [ingresos, setIngresos] = useState([])
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

            // Solo ingresos normales.
            // Las remesas se identifican porque tienen origenEmisora.
            const ingresosFiltrados = movimientosData.filter(
                (movimiento) =>
                    movimiento.tipo === 'Ingreso' &&
                    !movimiento.origenEmisora
            )

            setIngresos(ingresosFiltrados)
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

    async function guardarIngreso(e) {
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
                tipo: 'Ingreso',
                descripcion: formulario.descripcion,
                origenEmisora: '',
            }

            if (editandoId) {
                await movimientosApi.actualizar(
                    editandoId,
                    movimiento
                )

                setMensaje('Ingreso actualizado correctamente.')
            } else {
                await movimientosApi.crear(movimiento)

                setMensaje('Ingreso registrado correctamente.')
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (err) {
            setError(err.message)
        }
    }

    function editarIngreso(ingreso) {
        setEditandoId(ingreso.idMovimiento)

        setFormulario({
            idCategoria: ingreso.idCategoria,
            monto: ingreso.monto,
            fecha: ingreso.fecha?.split('T')[0] || '',
            descripcion: ingreso.descripcion || '',
        })

        setError('')
        setMensaje('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    async function eliminarIngreso(id) {
        const confirmar = window.confirm(
            '¿Seguro que deseas eliminar este ingreso?'
        )

        if (!confirmar) {
            return
        }

        try {
            setError('')
            setMensaje('')

            await movimientosApi.eliminar(id)

            setMensaje('Ingreso eliminado correctamente.')
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
        <main className="ingresos-container">
            <div className="ingresos-header">
                <div>
                    <h1>Ingresos</h1>

                    <p>
                        Registra y administra los ingresos
                        económicos de tu hogar.
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
                        ? 'Editar ingreso'
                        : 'Registrar ingreso'}
                </h2>

                <form onSubmit={guardarIngreso}>
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

                        <div className="campo campo-completo">
                            <label>Descripción</label>

                            <input
                                type="text"
                                name="descripcion"
                                value={formulario.descripcion}
                                onChange={manejarCambio}
                                placeholder="Ej. Salario mensual"
                            />
                        </div>

                    </div>

                    <div className="botones-formulario">
                        <button
                            type="submit"
                            className="btn-guardar"
                        >
                            {editandoId
                                ? 'Actualizar ingreso'
                                : 'Guardar ingreso'}
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
                <h2>Ingresos registrados</h2>

                {cargando ? (
                    <p>Cargando ingresos...</p>
                ) : ingresos.length === 0 ? (
                    <p className="sin-datos">
                        No hay ingresos registrados.
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
                                {ingresos.map((ingreso) => (
                                    <tr
                                        key={
                                            ingreso.idMovimiento
                                        }
                                    >
                                        <td>
                                            {new Date(
                                                ingreso.fecha
                                            ).toLocaleDateString()}
                                        </td>

                                        <td>
                                            {obtenerNombreCategoria(
                                                ingreso.idCategoria
                                            )}
                                        </td>

                                        <td className="monto-ingreso">
                                            +$
                                            {Number(
                                                ingreso.monto
                                            ).toFixed(2)}
                                        </td>

                                        <td>
                                            {ingreso.descripcion ||
                                                '-'}
                                        </td>

                                        <td className="acciones">
                                            <button
                                                onClick={() =>
                                                    editarIngreso(
                                                        ingreso
                                                    )
                                                }
                                                className="btn-editar"
                                            >
                                                Editar
                                            </button>

                                            <button
                                                onClick={() =>
                                                    eliminarIngreso(
                                                        ingreso.idMovimiento
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