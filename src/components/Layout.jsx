import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { alertasApi, notificacionesApi, invitacionesApi } from '../services/api'
import { useTranslation } from 'react-i18next'

export default function Layout({
    usuario,
    nombreFamiliar,
    cerrarSesion,
    onSesionActualizada
}) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [alertas, setAlertas] = useState([])
    const [cargandoAlertas, setCargandoAlertas] = useState(true)
    const [errorAlertas, setErrorAlertas] = useState('')

    const [notificaciones, setNotificaciones] = useState([])
    const [invitaciones, setInvitaciones] = useState([])
    const [procesandoInvitacion, setProcesandoInvitacion] = useState(false)
    const [errorInvitacion, setErrorInvitacion] = useState('')

    useEffect(() => {
        cargarAlertas()
    }, [])

    useEffect(() => {
        let vigente = true

        async function cargarBandeja() {
            try {
                const [notif, inv] = await Promise.all([
                    notificacionesApi.listar(1, 10),
                    invitacionesApi.mias(),
                ])

                if (!vigente) return

                setNotificaciones(notif.items || [])
                setInvitaciones(inv || [])
            } catch {
                // La bandeja es informativa: si falla, la app sigue usable.
            }
        }

        cargarBandeja()

        const temporizador = setInterval(cargarBandeja, 60000)

        return () => {
            vigente = false
            clearInterval(temporizador)
        }
    }, [usuario?.token])

    async function responderInvitacion(id, accion) {
        try {
            setProcesandoInvitacion(true)
            setErrorInvitacion('')

            if (accion === 'aceptar') {
                const datosUsuario = await invitacionesApi.aceptar(id)

                // Mismo contrato que HogarPendiente: el backend devuelve un
                // LoginResponse refrescado con el token nuevo.
                localStorage.setItem('token', datosUsuario.token)
                localStorage.setItem('usuario', JSON.stringify(datosUsuario))
                onSesionActualizada?.(datosUsuario)
            } else {
                await invitacionesApi.rechazar(id)
            }

            const [notif, inv] = await Promise.all([
                notificacionesApi.listar(1, 10),
                invitacionesApi.mias(),
            ])
            setNotificaciones(notif.items || [])
            setInvitaciones(inv || [])
        } catch (err) {
            setErrorInvitacion(
                err.message || 'No se pudo responder la invitación.'
            )
        } finally {
            setProcesandoInvitacion(false)
        }
    }

    async function marcarLeida(id) {
        try {
            await notificacionesApi.marcarLeida(id)
            setNotificaciones((prev) =>
                prev.map((n) =>
                    Number(n.idNotificacion) === Number(id)
                        ? { ...n, leida: true }
                        : n
                )
            )
        } catch {
            // Si falla el marcado, la próxima recarga lo reintenta.
        }
    }

    async function cargarAlertas() {
        try {
            setCargandoAlertas(true)
            setErrorAlertas('')

            const hoy = new Date()
            const inicioMes = new Date(
                hoy.getFullYear(),
                hoy.getMonth(),
                1
            )
            const finMes = new Date(
                hoy.getFullYear(),
                hoy.getMonth() + 1,
                0
            )

            const data = await alertasApi.listarPorPeriodo(
                inicioMes,
                finMes
            )

            setAlertas(data)
        } catch (err) {
            setAlertas([])
            setErrorAlertas(err.message)
        } finally {
            setCargandoAlertas(false)
        }
    }

    // Contract for the Outlet pages: when leaving a family the session is
    // refreshed in App (a LoginResponse without a household). salirDeFamilia
    // navigates home — the user keeps browsing the app without a family and
    // never lands on the create/search screen. cambiarDeFamilia navigates to
    // /hogar instead, where HogarPendiente (create/search) awaits whoever no
    // longer has a family.
    function salirDeFamilia(datosUsuario) {
        onSesionActualizada?.(datosUsuario)
        navigate('/')
    }

    function cambiarDeFamilia(datosUsuario) {
        onSesionActualizada?.(datosUsuario)
        navigate('/hogar')
    }

    return (
        <div className="min-h-screen bg-gray-100">

            <Navbar
                usuario={usuario}
                nombreFamiliar={nombreFamiliar}
                menuAbierto={menuAbierto}
                setMenuAbierto={setMenuAbierto}
                alertas={alertas}
                cargandoAlertas={cargandoAlertas}
                errorAlertas={errorAlertas}
                notificaciones={notificaciones}
                invitaciones={invitaciones}
                procesandoInvitacion={procesandoInvitacion}
                errorInvitacion={errorInvitacion}
                onResponderInvitacion={responderInvitacion}
                onMarcarLeida={marcarLeida}
            />

            <Sidebar
                usuario={usuario}
                cerrarSesion={cerrarSesion}
                menuAbierto={menuAbierto}
                setMenuAbierto={setMenuAbierto}
            />

            <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:ml-64">
                {/* CUENTA SIN FAMILIA: recordatorio no bloqueante. El flujo de
                    creación/búsqueda vive en /hogar, así que el resto de la app
                    sigue siendo usable sin familia. En /hogar se OMITE: allí el
                    usuario ya está dentro de ese flujo y el aviso duplicaría la
                    misma promesa. */}
                {!usuario?.idHogar && location.pathname !== '/hogar' && (
                    <div
                        role="status"
                        className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3"
                    >
                        <p className="text-sm font-medium text-blue-800">
                            {t('family.noFamilyBanner')}
                        </p>

                        <a
                            href="/hogar"
                            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                            {t('family.noFamilyBannerCta')}
                        </a>
                    </div>
                )}

                <Outlet context={{ salirDeFamilia, cambiarDeFamilia }} />

                <footer className="mt-10 border-t border-gray-200 pt-4 pb-2 text-xs text-gray-500">
                    <nav
                        aria-label={t('shell.legalLinks')}
                        className="flex flex-wrap gap-x-4 gap-y-1"
                    >
                        <a
                            href="/politica-de-privacidad"
                            className="transition hover:text-blue-600 hover:underline"
                        >
                            {t('shell.privacy')}
                        </a>
                        <a
                            href="/terminos-y-condiciones"
                            className="transition hover:text-blue-600 hover:underline"
                        >
                            {t('shell.terms')}
                        </a>
                        <a
                            href="/politica-de-cookies"
                            className="transition hover:text-blue-600 hover:underline"
                        >
                            {t('shell.cookies')}
                        </a>
                    </nav>
                </footer>
            </main>

        </div>
    )
}
