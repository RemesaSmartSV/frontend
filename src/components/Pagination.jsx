import {
    ChevronLeft,
    ChevronRight
} from 'lucide-react'

export default function Pagination({
    paginaActual,
    totalPaginas,
    cambiarPagina
}) {
    if (totalPaginas <= 1) {
        return null
    }

    const paginas = []

    for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i)
    }

    return (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">

            <button
                type="button"
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
                <ChevronLeft size={18} />
                <span>Anterior</span>
            </button>

            <div className="flex max-w-full flex-wrap justify-center gap-1">
                {paginas.map((pagina) => (
                    <button
                        key={pagina}
                        type="button"
                        onClick={() => cambiarPagina(pagina)}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${pagina === paginaActual
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {pagina}
                    </button>
                ))}
            </div>

            <button
                type="button"
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
                <span>Siguiente</span>
                <ChevronRight size={18} />
            </button>

        </div>
    )
}