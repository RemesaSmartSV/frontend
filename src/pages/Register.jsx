import { useState } from 'react'
import { authApi } from '../services/api'
import './Register.css'

export default function Register({ volverLogin }) {
    const [formulario, setFormulario] = useState({
        nombre: '',
        correo: '',
        contrasena: '',
        nombreFamiliar: '',
    })

    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    function manejarCambio(e) {
        const { name, value } = e.target

        setFormulario({
            ...formulario,
            [name]: value,
        })
    }

    async function registrar(e) {
        e.preventDefault()

        setMensaje('')
        setError('')
        setCargando(true)

        try {
            const respuesta = await authApi.register(formulario)

            setMensaje(
                `Cuenta creada correctamente.Bienvenido, ${ respuesta.nombre }`
            )

            setFormulario({
                nombre: '',
                correo: '',
                contrasena: '',
                nombreFamiliar: '',
            })
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <main className="register-container">
            <section className="register-card">

                <div className="register-header">
                    <h1>RemesaSmartSV</h1>

                    <h2>Crear cuenta</h2>

                    <p>
                        Regístrate para comenzar a administrar
                        las finanzas de tu hogar.
                    </p>
                </div>

                {mensaje && (
                    <div className="mensaje-exito">
                        {mensaje}
                    </div>
                )}

                {error && (
                    <div className="mensaje-error">
                        {error}
                    </div>
                )}

                <form onSubmit={registrar}>

                    <div className="campo">
                        <label>Nombre</label>

                        <input
                            type="text"
                            name="nombre"
                            value={formulario.nombre}
                            onChange={manejarCambio}
                            placeholder="Ingresa tu nombre"
                            required
                        />
                    </div>

                    <div className="campo">
                        <label>Correo</label>

                        <input
                            type="email"
                            name="correo"
                            value={formulario.correo}
                            onChange={manejarCambio}
                            placeholder="correo@ejemplo.com"
                            required
                        />
                    </div>

                    <div className="campo">
                        <label>Contraseña</label>

                        <input
                            type="password"
                            name="contrasena"
                            value={formulario.contrasena}
                            onChange={manejarCambio}
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                            required
                        />
                    </div>

                    <div className="campo">
                        <label>Nombre familiar</label>

                        <input
                            type="text"
                            name="nombreFamiliar"
                            value={formulario.nombreFamiliar}
                            onChange={manejarCambio}
                            placeholder="Ej. Familia Duarte"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-registrar"
                        disabled={cargando}
                    >
                        {cargando
                            ? 'Registrando...'
                            : 'Crear cuenta'}
                    </button>

                </form>

                <div className="login-link">
                    <p>¿Ya tienes una cuenta?</p>

                    <button
                        type="button"
                        onClick={volverLogin}
                    >
                        Iniciar sesión
                    </button>
                </div>

            </section>
        </main>
    )
}

