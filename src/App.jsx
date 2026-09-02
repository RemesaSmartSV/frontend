import { useState } from 'react'
import {
    BrowserRouter,
    Routes,
    Route
} from 'react-router-dom'

import Login from './pages/Login'
import Register from './pages/Register'

import Dashboard from './pages/Dashboard'
import Movimientos from './pages/Movimientos'
import Categorias from './pages/Categorias'
import Remesas from './pages/Remesas'
import Ingresos from './pages/Ingresos'
import Gastos from './pages/Gastos'
import Presupuestos from './pages/Presupuestos'

import Layout from './components/Layout'

import { authApi } from './services/api'


export default function App() {

    const [usuario, setUsuario] = useState(() => {
        const usuarioGuardado =
            localStorage.getItem('usuario')

        return usuarioGuardado
            ? JSON.parse(usuarioGuardado)
            : null
    })

    const [mostrarRegistro, setMostrarRegistro] =
        useState(false)

    function manejarLogin(datosUsuario) {
        setUsuario(datosUsuario)
    }

    function cerrarSesion() {
        authApi.cerrarSesion()
        setUsuario(null)
    }

    // Si no hay usuario, mostrar Login/Register

    if (!usuario) {

        if (mostrarRegistro) {
            return (
                <Register
                    volverLogin={() =>
                        setMostrarRegistro(false)
                    }
                />
            )
        }

        return (
            <Login
                onLogin={manejarLogin}
                irRegistro={() =>
                    setMostrarRegistro(true)
                }
            />
        )
    }

    // Usuario autenticado
    return (
        <BrowserRouter>

            <Routes>

                <Route
                    element={
                        <Layout
                            usuario={usuario}
                            cerrarSesion={cerrarSesion}
                        />
                    }
                >

                    <Route
                        path="/"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/movimientos"
                        element={<Movimientos />}
                    />

                    <Route
                        path="/categorias"
                        element={<Categorias />}
                    />

                    <Route
                        path="/remesas"
                        element={<Remesas />}
                    />

                    <Route
                        path="/ingresos"
                        element={<Ingresos />}
                    />

                    <Route
                        path="/gastos"
                        element={<Gastos />}
                    />

                    <Route
                        path="/presupuestos"
                        element={<Presupuestos />}
                    />

                </Route>

            </Routes>

        </BrowserRouter>

            )
    }

                