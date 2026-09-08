export default function Loading({ mensaje = 'Cargando...' }) {
    return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>

            <p className="text-sm text-gray-600">
                {mensaje}
            </p>
        </div>
    )
}