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

    return (
        <div
            className={`fixed right-5 top-5 z-50 flex w-80 items-center gap-3 rounded-lg border-l-4 p-4 shadow-lg ${estilos[tipo]}`}
        >
            <span className="text-xl font-bold">
                {iconos[tipo]}
            </span>

            <p className="flex-1 text-sm font-medium">
                {mensaje}
            </p>

            <button
                onClick={onClose}
                className="text-lg font-bold opacity-60 hover:opacity-100"
            >
                ×
            </button>
        </div>
    )
}