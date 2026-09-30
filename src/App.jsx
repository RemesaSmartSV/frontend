import { lazy, Suspense, useEffect, useState } from 'react'
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
} from 'react-router-dom'

import Loading from './components/Loading'
import Notification from './components/Notification'
import Layout from './components/Layout'
import Presentacion from './pages/Presentacion'
import PoliticaPrivacidad from './pages/PoliticaPrivacidad'
import TerminosYCondiciones from './pages/TerminosYCondiciones'
import PoliticaDeCookies from './pages/PoliticaDeCookies'

import {
    authApi,
    hogaresApi,
    setOnUnauthorized,
} from './services/api'

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

// La presentación comercial es una vista pública: se consulta en cada render
// para que funcione con o sin sesión, sin depender del router (sus enlaces
// apuntan a rutas absolutas y navegan con recarga).
function esPresentacion() {
    const ruta = window.location.pathname.replace(/\/+$/, '') || '/'
    return ruta === '/presentacion'
}

// Las páginas legales deben poder leerse SIN sesión, así que siguen el mismo
// camino que la presentación: se resuelven antes del router.
const PAGINAS_PUBLICAS = {
    '/politica-de-privacidad': PoliticaPrivacidad,
    '/terminos-y-condiciones': TerminosYCondiciones,
    '/politica-de-cookies': PoliticaDeCookies,
}

function paginaPublica() {
    const ruta = window.location.pathname.replace(/\/+$/, '') || '/'
    return PAGINAS_PUBLICAS[ruta] ?? null
}

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
        if (!usuarioGuardado) {
            return null
        }

        try {
            const datos = JSON.parse(usuarioGuardado)
            if (datos && typeof datos === 'object') {
                return datos
            }
        } catch {
            // Valor corrupto: se descarta en lugar de romper el arranque.
        }

        localStorage.removeItem('usuario')
        return null
    })
    const [mostrarRegistro, setMostrarRegistro] = useState(false)
    const [mensajeSesion, setMensajeSesion] = useState('')
    const [nombreFamiliar, setNombreFamiliar] = useState('')

    useEffect(() => {
        if (!usuario) {
            setNombreFamiliar('')
            return
        }

        let vigente = true

        async function cargarNombreFamiliar() {
            try {
                const hogar = await hogaresApi.obtenerMiHogar()

                if (vigente && hogar?.nombreFamiliar) {
                    setNombreFamiliar(hogar.nombreFamiliar)
                }
            } catch {
                // El nombre del hogar es informativo: si falla, se
                // mantiene el valor anterior y la app sigue usable.
            }
        }

        cargarNombreFamiliar()

        return () => {
            vigente = false
        }
    }, [usuario])

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

    const Publica = paginaPublica()

    if (Publica) {
        return <Publica />
    }

    if (esPresentacion()) {
        return <Presentacion />
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
                                nombreFamiliar={nombreFamiliar}
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
                        {/* Sin este catch-all, cualquier ruta desconocida
                            (por ejemplo un enlace viejo tras renombrar una
                            pagina en un merge) dejaba la app en pantalla
                            en blanco. */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
