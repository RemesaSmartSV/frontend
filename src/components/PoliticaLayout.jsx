/**
 * Compartida de las páginas legales: mismo encabezado, mismo ancho de lectura
 * y enlace de vuelta. Se renderiza fuera del router (igual que la presentación)
 * para que sea accesible también sin sesión iniciada.
 */
export default function PoliticaLayout({ titulo, actualizado, children }) {
    const { t, i18n } = useTranslation()
    const fechaActualizacion = new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'es-SV', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(`${actualizado}T12:00:00`))

    return (
        <main className="min-h-screen bg-white">
            <header className="border-b border-gray-200">
                <div className="mx-auto max-w-3xl px-6 py-8">
                    <div className="flex items-center justify-between gap-4">
                        <a
                            href="/"
                            className="text-sm font-medium text-blue-600 hover:underline"
                        >
                            {t('legal.back')}
                        </a>
                        <LanguageSelector />
                    </div>

                    <h1 className="mt-4 text-3xl font-semibold text-gray-900">
                        {titulo}
                    </h1>

                    <p className="mt-2 text-xs text-gray-500">
                        {t('legal.lastUpdated', { date: fechaActualizacion })}
                    </p>
                </div>
            </header>

            <article className="mx-auto max-w-3xl space-y-5 px-6 py-8 text-sm leading-relaxed text-gray-700">
                {children}
            </article>
        </main>
    )
}
import { useTranslation } from 'react-i18next'
import LanguageSelector from './LanguageSelector'
