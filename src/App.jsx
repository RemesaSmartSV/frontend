import { useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Movimientos from './pages/Movimientos'
import Categorias from './pages/Categorias'
import Remesas from './pages/Remesas'
import Ingresos from './pages/Ingresos'
import Gastos from './pages/Gastos'
import Dashboard from './pages/Dashboard'
import { authApi } from './services/api'
import './App.css'

export default function App() {
    const [usuario, setUsuario] = useState(() => {
        const usuarioGuardado = localStorage.getItem('usuario')

        return usuarioGuardado
            ? JSON.parse(usuarioGuardado)
            : null
    })

    const [mostrarRegistro, setMostrarRegistro] = useState(false)
    const [pagina, setPagina] = useState('movimientos')

    function manejarLogin(datosUsuario) {
        setUsuario(datosUsuario)
        setPagina('dashboard')
    }
    function cerrarSesion() {
        authApi.cerrarSesion()
        setUsuario(null)
    }

    if (!usuario) {
        if (mostrarRegistro) {
            return (
                <Register
                    volverLogin={() => setMostrarRegistro(false)}
                />
            )
        }

        return (
            <Login
                onLogin={manejarLogin}
                irRegistro={() => setMostrarRegistro(true)}
            />
        )
    }

    return (
        <div>
            <header className="app-header">
                <div>
                    <strong>RemesaSmartSV</strong>

                    <span>
                        Hola, {usuario.nombre}
                    </span>
                </div>

                <button onClick={cerrarSesion}>
                    Cerrar sesión
                </button>
            </header>

            <nav>
                <button onClick={() => setPagina('dashboard')}>
                    Inicio
                </button>

                <button
                    onClick={() => setPagina('movimientos')}
                >
                    Movimientos
                </button>

                <button
                    onClick={() => setPagina('categorias')}
                >
                    Categorías
                </button>

                <button onClick={() => setPagina('remesas')}>
                    Remesas
                </button>

                <button onClick={() => setPagina('ingresos')}>
                    Ingresos
                </button>

                <button onClick={() => setPagina('gastos')}>
                    Gastos
                </button>
            </nav>
            {pagina === 'dashboard' && <Dashboard />}

            {pagina === 'movimientos' && <Movimientos />}

            {pagina === 'remesas' && <Remesas />}

            {pagina === 'categorias' && <Categorias />}

            {pagina === 'ingresos' && <Ingresos />}

            {pagina === 'gastos' && <Gastos />}
        </div>
    )
}