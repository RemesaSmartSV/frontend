// Tintes de marca para chips de icono. Se usa bg-yellow-100 (y no amber-100)
// porque Index.css solo define el override dark para bg-yellow-100.
export const TONOS = {
    verde: 'bg-green-100 text-green-700',
    ambar: 'bg-yellow-100 text-amber-700',
    rojo: 'bg-red-100 text-red-700',
    azul: 'bg-blue-100 text-blue-700',
    violeta: 'bg-violet-100 text-violet-700',
}

export function ChipIcono({ Icono, tono, className = '' }) {
    return (
        <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONOS[tono]} ${className}`}
        >
            <Icono size={18} strokeWidth={2} />
        </span>
    )
}
