export default function Navbar({ usuario, cerrarSesion }) {
    return (
        <header className="flex items-center justify-between bg-white px-6 py-4 shadow">

            <div className="flex items-center gap-6">
                <strong className="text-xl font-bold text-blue-700">
                    RemesaSmartSV
                </strong>

                <span className="text-gray-600">
                    Hola, {usuario.nombre}
                </span>
            </div>

            <button
                onClick={cerrarSesion}
                className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            >
                Cerrar sesión
            </button>

        </header>
    )
}