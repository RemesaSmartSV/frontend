import { Inbox } from 'lucide-react'

// Empty state tipográfico y centrado, reutilizando las claves i18n existentes.
export function EstadoVacio({ Icono = Inbox, texto, className = '' }) {
    return (
        <div
            className={`flex flex-col items-center justify-center gap-3 px-4 text-center ${className}`}
        >
            <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"
            >
                <Icono size={22} strokeWidth={1.8} />
            </span>

            <p className="max-w-sm text-sm leading-6 text-slate-500">
                {texto}
            </p>
        </div>
    )
}
