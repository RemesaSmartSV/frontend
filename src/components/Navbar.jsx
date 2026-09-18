export default function Navbar({
    usuario,
    menuAbierto,
    setMenuAbierto
}) {
    const nombreFamilia =
        usuario?.familia ||
        usuario?.nombreFamiliar ||
        'Sin familia'

    return (
        <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white lg:ml-64">

            <div className="flex h-full items-center px-4 sm:px-6 lg:px-8">

                {/* BOTÓN MENÚ - SOLO CELULAR */}
                <button
                    type="button"
                    onClick={() => setMenuAbierto(!menuAbierto)}
                    className="mr-3 rounded-lg p-2 text-2xl text-[#123B8F] hover:bg-blue-50 lg:hidden"
                    aria-label={
                        menuAbierto
                            ? 'Cerrar menú'
                            : 'Abrir menú'
                    }
                >
                    {menuAbierto ? '✕' : '☰'}
                </button>

                {/* NOMBRE EN CELULAR */}
                <p className="text-base font-bold text-[#123B8F] lg:hidden">
                    Familia {nombreFamilia}
                </p>

                {/* INFORMACIÓN DEL HOGAR EN COMPUTADORA */}
                <div className="hidden lg:block">
                    <p className="text-xs font-medium tracking-wider text-gray-500">
                        HOGAR ACTIVO
                    </p>

                    <p className="text-base font-bold text-gray-800">
                        {nombreFamilia}
                    </p>
                </div>

            </div>

        </header>
    )
}