import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout({
    usuario,
    cerrarSesion
}) {

    const [menuAbierto, setMenuAbierto] =
        useState(false)

    return (
        <div className="min-h-screen bg-gray-100">

            <Navbar
                usuario={usuario}
                cerrarSesion={cerrarSesion}
                menuAbierto={menuAbierto}
                setMenuAbierto={setMenuAbierto}
            />

            <div className="flex">

                <Sidebar
                    menuAbierto={menuAbierto}
                    setMenuAbierto={setMenuAbierto}
                />

                <main className="min-w-0 flex-1 p-4 sm:p-6 lg:ml-64">
                    <Outlet />
                </main>

            </div>

        </div>
    )
}