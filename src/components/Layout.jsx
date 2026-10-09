import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { alertasApi, notificacionesApi, invitacionesApi } from '../services/api'

export default function Layout({
    usuario,
    nombreFamiliar,
    cerrarSesion,
    onSesionActualizada
}) {
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
                <Outlet />

                <footer className="mt-10 border-t border-gray-200 pt-4 pb-2 text-xs text-gray-500">
                    <nav
                        aria-label="Enlaces legales"
                        className="flex flex-wrap gap-x-4 gap-y-1"
                    >
                        <a
                            href="/politica-de-privacidad"
                            className="transition hover:text-blue-600 hover:underline"
                        >
                            Política de privacidad
                        </a>
                        <a
                            href="/terminos-y-condiciones"
                            className="transition hover:text-blue-600 hover:underline"
                        >
                            Términos y condiciones
                        </a>
                        <a
                            href="/politica-de-cookies"
                            className="transition hover:text-blue-600 hover:underline"
                        >
                            Política de cookies
                        </a>
                    </nav>
                </footer>
            </main>

        </div>
    )
}
