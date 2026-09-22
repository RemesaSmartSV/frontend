import { NavLink } from 'react-router-dom'
import {
    Home,
    ClipboardList,
    Tags,
    Banknote,
    TrendingUp,
    TrendingDown,
    Wallet,
    BookOpen,
    LogOut
} from 'lucide-react'

import logo from '../assets/remesa-smart (blanco).png'

export default function Sidebar({
    usuario,
    cerrarSesion,
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
                    className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                    onClick={() => setMenuAbierto(false)}
                />
            )}
            {/* SIDEBAR */}
            <aside
                className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col overflow-hidden bg-[#123B8F] px-5 pt-0 pb-6 text-white shadow-xl transition-transform duration-300  
                ${menuAbierto
                        ? 'translate-x-0'
                        : '-translate-x-full lg:translate-x-0'
                    }`}
            >

                {/* LOGO */}
                <div className="shrink-0 -mt-6 text-center">

                    <div className="flex justify-center">
                        
                        <img
                            src={logo}
                            alt="RemesaSmartSV"
                            className="h-40 w-auto object-contain"
                        />
                    </div>

                    </div>

                        

                    <p className="-mt-15 text-sm font-medium text-white/80 text-center">
                        Tus finanzas
                    </p>

                

                {/* TÍTULO DEL MENÚ */}
                <div className="mb-4 mt-8">

                    <p className="px-4 text-xs font-bold tracking-[0.15em] text-blue-200">
                        TU ESPACIO
                    </p>

                </div>


                {/* ENLACES */}
                <nav className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0">

                    <div className="flex flex-col gap-2">

                        {enlaces.map((enlace) => {

                            const Icono = enlace.icono

                            return (
                                <NavLink
                                    key={enlace.to}
                                    to={enlace.to}
                                    end={enlace.to === '/'}
                                    onClick={cerrarMenuMovil}
                                    className={({ isActive }) =>
                                        `
                                        flex items-center gap-4
                                        rounded-xl
                                        px-4 py-3
                                        text-sm font-semibold
                                        transition

                                        ${isActive
                                            ? 'bg-[#0B2E6B] text-white shadow-sm'
                                            : 'text-white/85 hover:bg-[#1D4FA3] hover:text-white'
                                        }
                                        `
                                    }
                                >

                                    <Icono
                                        size={21}
                                        strokeWidth={1.8}
                                    />

                                    <span>
                                        {enlace.nombre}
                                    </span>

                                </NavLink>
                            )
                        })}

                    </div>

                </nav>


                {/* USUARIO Y CERRAR SESIÓN */}
                <div className="mt-4 shrink-0 border-t border-white/15 pt-5">

                    <div className="flex items-center gap-3">

                        {/* Inicial */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                            {(usuario?.nombre || 'U')
                                .charAt(0)
                                .toUpperCase()}
                        </div>


                        {/* Nombre y rol */}
                        <div className="min-w-0 flex-1">

                            <p className="truncate text-sm font-bold text-white">
                                {usuario?.nombre || 'Usuario'}
                            </p>

                            <p className="mt-0.5 text-xs text-blue-200">
                                Administrador
                            </p>

                        </div>


                        {/* Cerrar sesión */}
                        <button
                            type="button"
                            onClick={cerrarSesion}
                            title="Cerrar sesión"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-blue-100 transition hover:bg-white/10 hover:text-white"
                        >
                            <LogOut
                                size={22}
                                strokeWidth={1.8}
                            />
                        </button>

                    </div>

                </div>

            </aside>
        </>
    )
}