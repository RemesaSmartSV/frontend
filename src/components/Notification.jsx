import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Info, TriangleAlert, X } from 'lucide-react'

export default function Notification({ tipo = 'success', mensaje, onClose }) {
    const { t } = useTranslation()
    const estilos = {
        success: 'border-green-500 bg-green-100 text-green-800',
        error: 'border-red-500 bg-red-100 text-red-800',
        warning: 'border-yellow-500 bg-yellow-100 text-yellow-800',
        info: 'border-blue-500 bg-blue-100 text-blue-800',
    }

    const iconos = {
        success: Check,
        error: X,
        warning: TriangleAlert,
        info: Info,
    }

    const Icono = iconos[tipo]

    useEffect(() => {
        if (!mensaje || tipo !== 'success' || !onClose) {
            return undefined
        }

        const timer = setTimeout(onClose, 4000)
        return () => clearTimeout(timer)
    }, [tipo, mensaje, onClose])

    if (!mensaje) return null

    return (
        <div
            role="alert"
            className={`fixed right-5 bottom-5 z-50 flex w-80 items-center gap-3 rounded-lg border-l-4 p-4 shadow-lg ${estilos[tipo]}`}
        >
            {Icono && (
                <span className="shrink-0" aria-hidden="true">
                    <Icono size={20} strokeWidth={2.5} />
                </span>
            )}

            <p className="flex-1 text-sm font-medium">
                {mensaje}
            </p>

            <button
                onClick={onClose}
                aria-label={t('common.cerrarNotificacion')}
                className="text-lg font-bold opacity-60 hover:opacity-100"
            >
                ×
            </button>
        </div>
    )
}
