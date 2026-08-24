import { useEffect, useState } from 'react'
import { categoriasApi } from '../services/api'
import './Categorias.css'

export default function Categorias() {
    const [categorias, setCategorias] = useState([])
    const [nombre, setNombre] = useState('')
    const [tipo, setTipo] = useState('Gasto')
    const [icono, setIcono] = useState('')

    const [editandoId, setEditandoId] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    useEffect(() => {
        cargarCategorias()
    }, [])

    async function cargarCategorias() {
        try {
            setCargando(true)
            setError('')

            const data = await categoriasApi.listar()
            setCategorias(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    async function guardarCategoria(e) {
        e.preventDefault()

        if (!nombre.trim()) {
            setError('Escribe el nombre de la categoría.')
            return
        }

        try {
            setError('')
            setMensaje('')

            const categoria = {
                nombre: nombre.trim(),
                tipo,
                icono: icono.trim() || null,
            }

            if (editandoId) {
                await categoriasApi.actualizar(editandoId, categoria)
                setMensaje('Categoría actualizada correctamente.')
            } else {
                await categoriasApi.crear(categoria)
                setMensaje('Categoría creada correctamente.')
            }

            limpiarFormulario()
            await cargarCategorias()
        } catch (err) {
            setError(err.message)
        }
    }

    function editarCategoria(categoria) {
        setEditandoId(categoria.idCategoria)
        setNombre(categoria.nombre)
        setTipo(categoria.tipo)
        setIcono(categoria.icono || '')
        setMensaje('')
        setError('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    async function eliminarCategoria(id) {
        const confirmar = window.confirm(
            '¿Seguro que deseas eliminar esta categoría?'
        )

        if (!confirmar) {
            return
        }

        try {
            setError('')
            setMensaje('')

            await categoriasApi.eliminar(id)

            setMensaje('Categoría eliminada correctamente.')
            await cargarCategorias()
        } catch (err) {
            setError(err.message)
        }
    }

    function limpiarFormulario() {
        setEditandoId(null)
        setNombre('')
        setTipo('Gasto')
        setIcono('')
    }

    return (
        <main className="categorias-container">
            <h1>Categorías</h1>

            <p className="subtitulo">
                Administra las categorías de tus ingresos y gastos.
            </p>

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
                        ? 'Editar categoría'
                        : 'Crear categoría'}
                </h2>

                <form onSubmit={guardarCategoria}>
                    <div className="form-grid">

                        <div className="campo">
                            <label>Nombre</label>

                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) =>
                                    setNombre(e.target.value)
                                }
                                placeholder="Ej. Alimentación"
                            />
                        </div>

                        <div className="campo">
                            <label>Tipo</label>

                            <select
                                value={tipo}
                                onChange={(e) =>
                                    setTipo(e.target.value)
                                }
                            >
                                <option value="Gasto">
                                    Gasto
                                </option>

                                <option value="Ingreso">
                                    Ingreso
                                </option>
                            </select>
                        </div>

                        <div className="campo">
                            <label>Ícono</label>

                            <input
                                type="text"
                                value={icono}
                                onChange={(e) =>
                                    setIcono(e.target.value)
                                }
                                placeholder="Ej. comida"
                            />
                        </div>

                    </div>

                    <div className="botones-formulario">
                        <button
                            type="submit"
                            className="btn-guardar"
                        >
                            {editandoId
                                ? 'Actualizar'
                                : 'Crear categoría'}
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
                    <h2>Categorías registradas</h2>

                    <button
                        onClick={cargarCategorias}
                        className="btn-recargar"
                    >
                        Actualizar
                    </button>
                </div>

                {cargando ? (
                    <p>Cargando categorías...</p>
                ) : categorias.length === 0 ? (
                    <p className="sin-datos">
                        No hay categorías registradas.
                    </p>
                ) : (
                    <div className="tabla-contenedor">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Tipo</th>
                                    <th>Ícono</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {categorias.map((categoria) => (
                                    <tr key={categoria.idCategoria}>
                                        <td>
                                            {categoria.nombre}
                                        </td>

                                        <td>
                                            {categoria.tipo}
                                        </td>

                                        <td>
                                            {categoria.icono || '-'}
                                        </td>

                                        <td className="acciones">
                                            <button
                                                onClick={() =>
                                                    editarCategoria(
                                                        categoria
                                                    )
                                                }
                                                className="btn-editar"
                                            >
                                                Editar
                                            </button>

                                            <button
                                                onClick={() =>
                                                    eliminarCategoria(
                                                        categoria.idCategoria
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