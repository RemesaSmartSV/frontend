import { useEffect, useRef } from 'react'

export default function ConfirmModal({
    abierto,
    titulo = 'Confirmar',
    mensaje,
    onConfirmar,
    onCancelar,
    textoConfirmar = 'Eliminar',
    textoCancelar = 'Cancelar',
}) {
    const botonCancelarRef = useRef(null)

    useEffect(() => {
        if (abierto && botonCancelarRef.current) {
            botonCancelarRef.current.focus()
        }
    }, [abierto])

    useEffect(() => {
        function manejarEsc(e) {
            if (e.key === 'Escape' && abierto) {
                onCancelar()
            }
        }

        document.addEventListener('keydown', manejarEsc)
        return () => document.removeEventListener('keydown', manejarEsc)
    }, [abierto, onCancelar])

    if (!abierto) return null

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            onClick={onCancelar}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
                    ⚠️
                </div>

                <h3
                    id="confirm-modal-title"
                    className="mt-4 text-lg font-bold text-gray-900"
                >
                    {titulo}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {mensaje}
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                        ref={botonCancelarRef}
                        onClick={onCancelar}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                    >
                        {textoCancelar}
                    </button>

                    <button
                        onClick={onConfirmar}
                        className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 sm:w-auto"
                    >
                        {textoConfirmar}
                    </button>
                </div>
            </div>
        </div>
    )
}
