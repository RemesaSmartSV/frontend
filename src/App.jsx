import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
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
        return usuarioGuardado ? JSON.parse(usuarioGuardado) : null
    })

    const [mostrarRegistro, setMostrarRegistro] = useState(false)

    function manejarLogin(datosUsuario) {
        setUsuario(datosUsuario)
    }

    function cerrarSesion() {
        authApi.cerrarSesion()
        setUsuario(null)
    }

    if (!usuario) {
        if (mostrarRegistro) {
            return <Register volverLogin={() => setMostrarRegistro(false)} />
        }
        return <Login onLogin={manejarLogin} irRegistro={() => setMostrarRegistro(true)} />
    }

    return (
        <BrowserRouter>
            <div>
                <header className="app-header">
                    <div>
                        <strong>RemesaSmartSV</strong>
                        <span>Hola, {usuario.nombre}</span>
                    </div>
                    <button onClick={cerrarSesion}>Cerrar sesión</button>
                </header>

                <nav>
                    <Link to="/dashboard"><button>Inicio</button></Link>
                    <Link to="/movimientos"><button>Movimientos</button></Link>
                    <Link to="/categorias"><button>Categorías</button></Link>
                    <Link to="/remesas"><button>Remesas</button></Link>
                    <Link to="/ingresos"><button>Ingresos</button></Link>
                    <Link to="/gastos"><button>Gastos</button></Link>
                </nav>

                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/movimientos" element={<Movimientos />} />
                    <Route path="/remesas" element={<Remesas />} />
                    <Route path="/categorias" element={<Categorias />} />
                    <Route path="/ingresos" element={<Ingresos />} />
                    <Route path="/gastos" element={<Gastos />} />
                </Routes>
            </div>
        </BrowserRouter>
    )
}