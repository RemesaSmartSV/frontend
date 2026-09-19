import { useEffect, useState } from 'react'
import {
    BrowserRouter,
    Routes,
    Route,
    useLocation
} from 'react-router-dom'

import Loading from './components/Loading'
import Notification from './components/Notification'
import Layout from './components/Layout'

import { authApi, setOnUnauthorized } from './services/api'


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

    useEffect(() => {
        setOnUnauthorized(() => setUsuario(null))

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

    // Si no hay usuario, mostrar Login o Register

    if (!usuario) {

        if (mostrarRegistro) {
            return (
                <Suspense fallback={<Loading mensaje="Cargando..." />}>
                    <Register
                        volverLogin={() =>
                            setMostrarRegistro(false)
                        }
                    />
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
                        irRegistro={() =>
                            setMostrarRegistro(true)
                        }
                    />
                </Suspense>
            </>
        )
    }


    // Usuario autenticado

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

export default function App() {
    return <AppContent />
}
