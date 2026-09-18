import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout({
    usuario,
    cerrarSesion
}) {
    const [menuAbierto, setMenuAbierto] = useState(false)

    return (
        <div className="min-h-screen bg-gray-100">

            <Navbar
                usuario={usuario}
                menuAbierto={menuAbierto}
                setMenuAbierto={setMenuAbierto}
            />

            <Sidebar
                usuario={usuario}
                cerrarSesion={cerrarSesion}
                menuAbierto={menuAbierto}
                setMenuAbierto={setMenuAbierto}
            />

            <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:ml-64">
                <Outlet />
            </main>

        </div>
    )
}