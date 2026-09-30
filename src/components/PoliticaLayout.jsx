/**
 * Compartida de las páginas legales: mismo encabezado, mismo ancho de lectura
 * y enlace de vuelta. Se renderiza fuera del router (igual que la presentación)
 * para que sea accesible también sin sesión iniciada.
 */
export default function PoliticaLayout({ titulo, actualizado, children }) {
    return (
        <main className="min-h-screen bg-white">
            <header className="border-b border-gray-200">
                <div className="mx-auto max-w-3xl px-6 py-8">
                    <a
                        href="/"
                        className="text-sm font-medium text-blue-600 hover:underline"
                    >
                        &larr; Volver a RemesaSmart SV
                    </a>

                    <h1 className="mt-4 text-3xl font-semibold text-gray-900">
                        {titulo}
                    </h1>

                    <p className="mt-2 text-xs text-gray-500">
                        Última actualización: {actualizado}
                    </p>
                </div>
            </header>

            <article className="mx-auto max-w-3xl space-y-5 px-6 py-8 text-sm leading-relaxed text-gray-700">
                {children}
            </article>
        </main>
    )
}
