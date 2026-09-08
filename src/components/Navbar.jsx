import { Menu, X } from 'lucide-react'
import logo from '../assets/logo_remesa-sinfondo.png'

export default function Navbar({
    usuario,
    cerrarSesion,
    menuAbierto,
    setMenuAbierto
}) {
    return (
        <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-gray-200 bg-white px-2 shadow-sm sm:px-0">

            <div className="flex items-center gap-3">

                <button
                    type="button"
                    onClick={() => setMenuAbierto(!menuAbierto)}
                    className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 lg:hidden"
                    aria-label={
                        menuAbierto
                            ? 'Cerrar menú'
                            : 'Abrir menú'
                    }
                >
                    {menuAbierto ? (
                        <X size={24} />
                    ) : (
                        <Menu size={24} />
                    )}
                </button>

                <div className="flex items-center">
                    <img
                        src={logo}
                        alt="RemesaSmartSV"
                        className="h-34 w-auto object-contain sm:h-38"
                    />
                </div>

            </div>

            <div className="flex items-center gap-2 sm:gap-3">

                <div className="hidden text-right sm:block">
                    <p className="text-xs text-gray-400">
                        Hola
                    </p>

                    <p className="font-semibold text-gray-700">
                        {usuario?.nombre || 'Usuario'}
                    </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 sm:h-10 sm:w-10 sm:text-base">
                    {(usuario?.nombre || 'U')
                        .charAt(0)
                        .toUpperCase()}
                </div>

                <button
                    onClick={cerrarSesion}
                    className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600 active:scale-95 sm:px-4"
                >
                    <span className="hidden sm:inline">
                        Cerrar sesión
                    </span>

                    <span className="sm:hidden">
                        Salir
                    </span>
                </button>

            </div>

        </header>
    )
}