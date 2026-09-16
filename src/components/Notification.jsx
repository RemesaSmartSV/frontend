import { useEffect } from 'react'

export default function Notification({ tipo = 'success', mensaje, onClose }) {
    if (!mensaje) return null

    const estilos = {
        success: 'border-green-500 bg-green-100 text-green-800',
        error: 'border-red-500 bg-red-100 text-red-800',
        warning: 'border-yellow-500 bg-yellow-100 text-yellow-800',
        info: 'border-blue-500 bg-blue-100 text-blue-800',
    }

    const iconos = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    }

    useEffect(() => {
        if (tipo === 'success' && onClose) {
            const timer = setTimeout(onClose, 4000)
            return () => clearTimeout(timer)
        }
    }, [tipo, onClose])

    return (
        <div
            role="alert"
            className={`fixed right-5 top-5 z-50 flex w-80 items-center gap-3 rounded-lg border-l-4 p-4 shadow-lg ${estilos[tipo]}`}
        >
            <span className="text-xl font-bold" aria-hidden="true">
                {iconos[tipo]}
            </span>

            <p className="flex-1 text-sm font-medium">
                {mensaje}
            </p>

            <button
                onClick={onClose}
                aria-label="Cerrar notificación"
                className="text-lg font-bold opacity-60 hover:opacity-100"
            >
                ×
            </button>
        </div>
    )
}
