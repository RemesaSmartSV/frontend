import { NavLink } from 'react-router-dom'

export default function Sidebar() {
    return (
        <aside className="min-h-screen w-64 bg-gray-900 p-4 text-white">

            <h3 className="mb-6 text-xl font-bold">
                Menú
            </h3>

            <nav className="flex flex-col gap-2">

                <NavLink
                    to="/"
                    className="rounded-lg px-4 py-3 hover:bg-gray-700"
                >
                    Inicio
                </NavLink>

                <NavLink
                    to="/movimientos"
                    className="rounded-lg px-4 py-3 hover:bg-gray-700"
                >
                    Movimientos
                </NavLink>

                <NavLink
                    to="/categorias"
                    className="rounded-lg px-4 py-3 hover:bg-gray-700"
                >
                    Categorías
                </NavLink>

                <NavLink
                    to="/remesas"
                    className="rounded-lg px-4 py-3 hover:bg-gray-700"
                >
                    Remesas
                </NavLink>

                <NavLink
                    to="/ingresos"
                    className="rounded-lg px-4 py-3 hover:bg-gray-700"
                >
                    Ingresos
                </NavLink>

                <NavLink
                    to="/gastos"
                    className="rounded-lg px-4 py-3 hover:bg-gray-700"
                >
                    Gastos
                </NavLink>

                <NavLink
                    to="/presupuestos"
                    className="rounded-lg px-4 py-3 hover:bg-gray-700"
                >
                    Presupuestos
                </NavLink>

            </nav>

        </aside>
    )
}