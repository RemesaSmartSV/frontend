import { lazy, Suspense, useEffect, useState } from 'react'
import {
    BrowserRouter,
    Routes,
    Route,
    useLocation,
} from 'react-router-dom'

import Loading from './components/Loading'
import Notification from './components/Notification'
import Layout from './components/Layout'

import { authApi, setOnUnauthorized } from './services/api'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Movimientos = lazy(() => import('./pages/Movimientos'))
const Categorias = lazy(() => import('./pages/Categorias'))
const Remesas = lazy(() => import('./pages/Remesas'))
const Ingresos = lazy(() => import('./pages/Ingresos'))
const Gastos = lazy(() => import('./pages/Gastos'))
const Presupuestos = lazy(() => import('./pages/Presupuestos'))
const EducacionFinanciera = lazy(() => import('./pages/EducacionFinanciera'))

function ScrollToTop() {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])

    return null
}

export default function App() {
    const [usuario, setUsuario] = useState(() => {
        const usuarioGuardado = localStorage.getItem('usuario')
        return usuarioGuardado ? JSON.parse(usuarioGuardado) : null
    })
    const [mostrarRegistro, setMostrarRegistro] = useState(false)
    const [mensajeSesion, setMensajeSesion] = useState('')

    useEffect(() => {
        setOnUnauthorized(() => {
            setUsuario(null)
            setMensajeSesion('Tu sesión expiró. Inicia sesión nuevamente.')
        })

        return () => setOnUnauthorized(null)
    }, [])

    function manejarLogin(datosUsuario) {
        setMensajeSesion('')
        setUsuario(datosUsuario)
    }

    function cerrarSesion() {
        authApi.cerrarSesion()
        setUsuario(null)
        setMostrarRegistro(false)
    }

    if (!usuario) {
        if (mostrarRegistro) {
            return (
                <Suspense fallback={<Loading mensaje="Cargando..." />}>
                    <Register volverLogin={() => setMostrarRegistro(false)} />
                </Suspense>
            )
        }

        return (
            <>
                <Notification
                    tipo="info"
                    mensaje={mensajeSesion}
                    onClose={() => setMensajeSesion('')}
                />
                <Suspense fallback={<Loading mensaje="Cargando..." />}>
                    <Login
                        onLogin={manejarLogin}
                        irRegistro={() => setMostrarRegistro(true)}
                    />
                </Suspense>
            </>
        )
    }

    return (
        <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<Loading mensaje="Cargando página..." />}>
                <Routes>
                    <Route
                        element={
                            <Layout
                                usuario={usuario}
                                cerrarSesion={cerrarSesion}
                            />
                        }
                    >
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/movimientos" element={<Movimientos />} />
                        <Route path="/categorias" element={<Categorias />} />
                        <Route path="/remesas" element={<Remesas />} />
                        <Route path="/ingresos" element={<Ingresos />} />
                        <Route path="/gastos" element={<Gastos />} />
                        <Route path="/presupuestos" element={<Presupuestos />} />
                        <Route
                            path="/educacion-financiera"
                            element={<EducacionFinanciera />}
                        />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
