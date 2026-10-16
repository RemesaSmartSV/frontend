import { lazy, Suspense, useEffect, useState } from 'react'
import i18n, { normalizarIdioma } from './i18n/index.js'
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
const Ahorro = lazy(() => import('./pages/Ahorro'))
const MiHogar = lazy(() => import('./pages/MiHogar'))
const EducacionFinanciera = lazy(() => import('./pages/EducacionFinanciera'))
const MiPerfil = lazy(() => import('./pages/MiPerfil'))
const HogarPendiente = lazy(() => import('./pages/HogarPendiente'))

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
        const idiomaPerfil = normalizarIdioma(usuario?.idiomaPreferido)
        if (idiomaPerfil) i18n.changeLanguage(idiomaPerfil)
    }, [usuario])

    useEffect(() => {
        // Sin hogar no se consulta el endpoint: GET /Hogares responde 404
        // (el backend lo devuelve solo cuando hay hogar asociado), y hacerlo
        // en cada montaje solo ensuciaría la consola. El nombre se limpia
        // para que el Navbar caiga en su propio fallback "Sin familia".
        if (!usuario?.idHogar) {
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
        setMensajeSesion(i18n.t('shell.sessionExpired'))
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
                <Suspense fallback={<Loading />}>
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
                <Suspense fallback={<Loading />}>
                    <Login
                        onLogin={manejarLogin}
                        irRegistro={() => setMostrarRegistro(true)}
                    />
                </Suspense>
            </>
        )
    }

    // Sin familia NO hay muro: el router se monta igual y toda la app queda
    // navegable (antes este bloque devolvía HogarPendiente por fuera de
    // BrowserRouter y dejaba la cuenta sin hogar sin rutas ni navegación).
    // La pantalla de creación/búsqueda vive ahora en la ruta /hogar —ahí
    // MiHogar no corresponde cuando no hay hogar—, el Layout muestra un
    // banner con el acceso a esa pantalla, y el resto de las páginas
    // renderizan sus estados vacíos habituales (los GET filtran por
    // idHogar = 0 y devuelven lista vacía).
    return (
        <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<Loading mensaje={i18n.t('shell.loadPage')} />}>
                <Routes>
                    <Route
                        element={
                            <Layout
                                usuario={usuario}
                                nombreFamiliar={nombreFamiliar}
                                cerrarSesion={cerrarSesion}
                                onSesionActualizada={manejarLogin}
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
                        <Route path="/ahorro" element={<Ahorro />} />
                        <Route
                            path="/hogar"
                            element={
                                // Con hogar: la pantalla de familia. Sin hogar:
                                // el flujo de creación/búsqueda (mismo
                                // componente que antes bloqueaba la app, ahora
                                // es una ruta más y manejarLogin lo saca de
                                // aquí al recibir el LoginResponse refrescado).
                                usuario.idHogar ? (
                                    <MiHogar />
                                ) : (
                                    <HogarPendiente onHogarCreado={manejarLogin} />
                                )
                            }
                        />
                        <Route
                            path="/educacion-financiera"
                            element={<EducacionFinanciera />}
                        />
                        <Route path="/perfil" element={<MiPerfil />} />
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
