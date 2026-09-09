import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { alertasApi } from '../services/api'

export default function Layout({
    usuario,
    cerrarSesion
}) {

    const [menuAbierto, setMenuAbierto] =
        useState(false)
    const [alertas, setAlertas] = useState([])
    const [cargandoAlertas, setCargandoAlertas] = useState(true)
    const [errorAlertas, setErrorAlertas] = useState('')
    const location = useLocation()

    useEffect(() => {
        cargarAlertas()
    }, [location.pathname])

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
                cerrarSesion={cerrarSesion}
                menuAbierto={menuAbierto}
                setMenuAbierto={setMenuAbierto}
                alertas={alertas}
                cargandoAlertas={cargandoAlertas}
                errorAlertas={errorAlertas}
            />

            <div className="flex">

                <Sidebar
                    menuAbierto={menuAbierto}
                    setMenuAbierto={setMenuAbierto}
                />

                <main className="min-w-0 flex-1 p-4 sm:p-6">
                    <Outlet />
                </main>

            </div>

        </div>
    )
}