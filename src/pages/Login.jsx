import { useState } from 'react'
import { authApi } from '../services/api'
import './Login.css'

export default function Login({ onLogin, irRegistro }) {
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    async function iniciarSesion(e) {
        e.preventDefault()

        if (!correo || !contrasena) {
            setError('Completa todos los campos.')
            return
        }

        try {
            setCargando(true)
            setError('')

            const usuario = await authApi.login(correo, contrasena)

            onLogin(usuario)
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <main className="login-container">
            <section className="login-card">
                <h1>RemesaSmartSV</h1>

                <h2>Iniciar sesión</h2>

                <p>
                    Ingresa a tu cuenta para administrar tus finanzas.
                </p>

                {error && (
                    <div className="mensaje-error">
                        {error}
                    </div>
                )}

                <form onSubmit={iniciarSesion}>
                    <div className="campo">
                        <label>Correo</label>

                        <input
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="correo@ejemplo.com"
                        />
                    </div>

                    <div className="campo">
                        <label>Contraseña</label>

                        <input
                            type="password"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            placeholder="Contraseña"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                    >
                        {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </button>
                </form>
                <div className="registro-link">
                    <p>¿No tienes una cuenta?</p>

                    <button
                        type="button"
                        onClick={irRegistro}
                    >
                        Crear cuenta
                    </button>
                </div>
            </section>
        </main>
    )
}