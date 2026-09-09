import { NavLink } from 'react-router-dom'
import {
    Home,
    ClipboardList,
    Tags,
    Banknote,
    TrendingUp,
    TrendingDown,
    Wallet,
    BookOpen
} from 'lucide-react'

export default function Sidebar({
    menuAbierto,
    setMenuAbierto
}) {

    const enlaces = [
        {
            to: '/',
            nombre: 'Inicio',
            icono: Home,
        },
        {
            to: '/movimientos',
            nombre: 'Movimientos',
            icono: ClipboardList,
        },
        {
            to: '/categorias',
            nombre: 'Categorías',
            icono: Tags,
        },
        {
            to: '/remesas',
            nombre: 'Remesas',
            icono: Banknote,
        },
        {
            to: '/ingresos',
            nombre: 'Ingresos',
            icono: TrendingUp,
        },
        {
            to: '/gastos',
            nombre: 'Gastos',
            icono: TrendingDown,
        },
        {
            to: '/presupuestos',
            nombre: 'Presupuestos',
            icono: Wallet,
        },
        {
            to: '/educacion-financiera',
            nombre: 'Educación Financiera',
            icono: BookOpen,
        },
    ]

    function cerrarMenuMovil() {
        setMenuAbierto(false)
    }

    return (
        <>
            {/* Fondo oscuro en móvil */}
            {menuAbierto && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={cerrarMenuMovil}
                />
            )}

            <aside
                className={`
                    fixed left-0 top-20 z-50
                   h-[calc(100vh-80px)]
                    w-72 bg-gray-900 p-4 text-white
                    shadow-xl
                    transition-transform duration-300
                    lg:static lg:z-auto lg:h-[calc(100vh-72px)]
                    lg:w-64 lg:shrink-0
                    lg:translate-x-0 lg:shadow-none
                    ${menuAbierto
                        ? 'translate-x-0'
                        : '-translate-x-full'
                    }
                `}
            >

                <div className="mb-6 border-b border-gray-700 pb-5">
                    <h3 className="text-xl font-bold">
                        Menú
                    </h3>

                    <p className="mt-1 text-xs text-gray-400">
                        Administración financiera
                    </p>
                </div>

                <nav className="flex flex-col gap-2">

                    {enlaces.map((enlace) => {

                        const Icono = enlace.icono

                        return (
                            <NavLink
                                key={enlace.to}
                                to={enlace.to}
                                end={enlace.to === '/'}
                                onClick={cerrarMenuMovil}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`
                                }
                            >
                                <Icono size={19} />

                                <span>
                                    {enlace.nombre}
                                </span>
                            </NavLink>
                        )
                    })}

                </nav>

            </aside>
        </>
    )
}