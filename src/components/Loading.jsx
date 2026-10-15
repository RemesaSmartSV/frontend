import { useTranslation } from 'react-i18next'

export default function Loading({ mensaje }) {
    const { t } = useTranslation()
    return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>

            <p className="text-sm text-gray-600">
                {mensaje || t('common.cargando')}
            </p>
        </div>
    )
}
