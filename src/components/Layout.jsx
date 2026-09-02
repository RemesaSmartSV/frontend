import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout({ usuario, cerrarSesion }) {
    return (
        <div className="min-h-screen bg-gray-100">

            <Navbar
                usuario={usuario}
                cerrarSesion={cerrarSesion}
            />

            <div className="flex">

                <Sidebar />

                <main className="flex-1 p-6">
                    <Outlet />
                </main>

            </div>

        </div>
    )
}