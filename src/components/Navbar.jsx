import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'

export default function Navbar({
    usuario,
    menuAbierto,
    setMenuAbierto,
    alertas,
    cargandoAlertas,
    errorAlertas
}) {
    const nombreFamilia =
        usuario?.familia ||
        usuario?.nombreFamiliar ||
        'Sin familia'

    const [alertasAbiertas, setAlertasAbiertas] = useState(false)
    const alertasRef = useRef(null)

    useEffect(() => {
        function cerrarAlClickearFuera(e) {
            if (alertasRef.current && !alertasRef.current.contains(e.target)) {
                setAlertasAbiertas(false)
            }
        }

        if (alertasAbiertas) {
            document.addEventListener('mousedown', cerrarAlClickearFuera)
        }

        return () => {
            document.removeEventListener('mousedown', cerrarAlClickearFuera)
        }
    }, [alertasAbiertas])

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

            <div className="absolute right-4 top-0 flex h-full items-center gap-2 sm:right-6">

                <div className="relative" ref={alertasRef}>
                    <button
                        type="button"
                        onClick={() => setAlertasAbiertas(!alertasAbiertas)}
                        className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                        aria-label="Ver alertas"
                        aria-expanded={alertasAbiertas}
                    >
                        <Bell size={21} />

                        {alertas.length > 0 && (
                            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                {alertas.length > 9 ? '9+' : alertas.length}
                            </span>
                        )}
                    </button>

                    {alertasAbiertas && (
                        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 className="font-semibold text-gray-800">
                                    Alertas de presupuesto
                                </h2>

                                {alertas.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                        {alertas.length} activa{alertas.length === 1 ? '' : 's'}
                                    </span>
                                )}
                            </div>

                            {cargandoAlertas && (
                                <p className="text-sm text-gray-500">
                                    Consultando alertas...
                                </p>
                            )}

                            {!cargandoAlertas && errorAlertas && (
                                <p className="text-sm text-red-600">
                                    No se pudieron cargar las alertas.
                                </p>
                            )}

                            {!cargandoAlertas && !errorAlertas && alertas.length === 0 && (
                                <p className="text-sm text-gray-500">
                                    No hay alertas para el mes actual.
                                </p>
                            )}

                            {!cargandoAlertas && !errorAlertas && alertas.length > 0 && (
                                <ul className="max-h-72 space-y-3 overflow-y-auto">
                                    {alertas.map((alerta, indice) => {
                                        const esCritica = alerta.tipoAlerta === 'Crítico'

                                        return (
                                            <li
                                                key={`${alerta.tipoAlerta}-${indice}`}
                                                className={`rounded-lg border-l-4 p-3 ${esCritica
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-amber-500 bg-amber-50'
                                                    }`}
                                            >
                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                    <strong className={`text-xs uppercase ${esCritica ? 'text-red-700' : 'text-amber-700'}`}>
                                                        {alerta.tipoAlerta}
                                                    </strong>
                                                    <span className="text-xs font-semibold text-gray-600">
                                                        {alerta.porcentajeUsado}%
                                                    </span>
                                                </div>

                                                <p className="text-sm leading-5 text-gray-700">
                                                    {alerta.mensaje}
                                                </p>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <div className="hidden text-right sm:block">
                    <p className="text-xs text-gray-400">
                        Hola
                    </p>

                    <p className="font-semibold text-gray-700">
                        {usuario?.nombre || 'Usuario'}
                    </p>

                    <p className="text-xs text-gray-400">
                        {usuario?.rol || 'Miembro'}
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
