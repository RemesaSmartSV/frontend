import { useCallback, useEffect, useState } from 'react'
import { educacionApi } from '../services/api'
import Notification from '../components/Notification'
import Loading from '../components/Loading'

export default function EducacionFinanciera() {
    const [tips, setTips] = useState([])
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    const cargarTips = useCallback(async () => {
        try {
            setCargando(true)
            setError('')

            const datos = await educacionApi.listar()

            setTips(datos)
        } catch (err) {
            setError(
                err.message ||
                'No se pudieron cargar los consejos financieros.'
            )
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        cargarTips()
    }, [cargarTips])

    async function actualizarTips() {
        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            await cargarTips()

            setMensaje(
                'Consejos financieros actualizados correctamente.'
            )
        } catch (err) {
            setError(
                err.message ||
                'No se pudieron actualizar los consejos financieros.'
            )
        } finally {
            setProcesando(false)
        }
    }

    return (
        <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">

            {/* NOTIFICACIONES */}
            <Notification
                tipo="success"
                mensaje={mensaje}
                onClose={() => setMensaje('')}
            />

            <Notification
                tipo="error"
                mensaje={error}
                onClose={() => setError('')}
            />

            {/* ENCABEZADO */}
            <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-5 text-white shadow-lg sm:p-8">

                <div className="max-w-3xl">

                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-sm sm:h-14 sm:w-14 sm:text-3xl">
                        💡
                    </div>

                    <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">
                        Educación Financiera
                    </h1>

                    <p className="mt-3 text-sm leading-relaxed text-emerald-50 sm:text-base md:text-lg">
                        Aprende a administrar mejor tu dinero con consejos
                        prácticos para mejorar tus hábitos financieros.
                    </p>

                </div>

            </section>

            {/* INTRODUCCIÓN */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

                <div className="flex items-start gap-3 sm:gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl sm:h-12 sm:w-12 sm:text-2xl">
                        📚
                    </div>

                    <div className="min-w-0">

                        <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
                            Aprende y toma mejores decisiones
                        </h2>

                        <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
                            La educación financiera te ayuda a comprender cómo
                            administrar tus ingresos, controlar tus gastos,
                            ahorrar y tomar decisiones responsables con tu
                            dinero.
                        </p>

                    </div>

                </div>

            </section>

            {/* TÍTULO DE CONSEJOS */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0">

                    <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
                        Consejos financieros
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 sm:text-base">
                        Recomendaciones para mejorar tus finanzas personales.
                    </p>

                </div>

                <button
                    onClick={actualizarTips}
                    disabled={cargando || procesando}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2"
                >
                    {procesando
                        ? 'Actualizando...'
                        : 'Actualizar'}
                </button>

            </div>

            {/* CARGANDO */}
            {cargando && (
                <Loading mensaje="Cargando consejos financieros..." />
            )}

            {/* ERROR */}
            {!cargando && error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">

                    <div className="flex items-start gap-3 sm:gap-4">

                        <div className="shrink-0 text-2xl">
                            ⚠️
                        </div>

                        <div className="min-w-0 flex-1">

                            <h3 className="font-bold text-red-800">
                                No se pudieron cargar los consejos
                            </h3>

                            <p className="mt-1 break-words text-sm text-red-700">
                                {error}
                            </p>

                            <button
                                onClick={actualizarTips}
                                disabled={procesando}
                                className="mt-4 w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2"
                            >
                                {procesando
                                    ? 'Intentando...'
                                    : 'Intentar nuevamente'}
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* SIN TIPS */}
            {!cargando && !error && tips.length === 0 && (
                <div className="rounded-2xl bg-white p-6 text-center shadow-sm sm:p-10">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl sm:h-16 sm:w-16 sm:text-3xl">
                        📖
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-gray-800 sm:text-xl">
                        Aún no hay consejos
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 sm:text-base">
                        Actualmente no hay contenido de educación financiera
                        disponible.
                    </p>

                </div>
            )}

            {/* TARJETAS */}
            {!cargando && !error && tips.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">

                    {tips.map((tip) => (
                        <article
                            key={tip.idTip}
                            className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >

                            {/* BARRA SUPERIOR */}
                            <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-400" />

                            <div className="p-5 sm:p-6">

                                {/* ICONO */}
                                <div className="mb-5 flex items-center justify-between gap-3">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl transition group-hover:scale-110 sm:h-12 sm:w-12 sm:text-2xl">
                                        💰
                                    </div>

                                    <span className="whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        Consejo
                                    </span>

                                </div>

                                {/* TÍTULO */}
                                <h3 className="break-words text-lg font-bold text-gray-800 sm:text-xl">
                                    {tip.titulo}
                                </h3>

                                {/* CONTENIDO */}
                                <p className="mt-3 break-words text-sm leading-relaxed text-gray-600 sm:text-base">
                                    {tip.contenido}
                                </p>

                                {/* CATEGORÍA */}
                                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">

                                    <span className="text-sm text-gray-400">
                                        Categoría
                                    </span>

                                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                        #{tip.idCategoria}
                                    </span>

                                </div>

                            </div>

                        </article>
                    ))}

                </div>
            )}

            {/* PIE */}
            {!cargando && !error && tips.length > 0 && (
                <section className="rounded-2xl bg-gray-900 p-5 text-white shadow-lg sm:p-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div className="min-w-0">

                            <h3 className="text-base font-bold sm:text-lg">
                                💚 Pequeños hábitos, grandes cambios
                            </h3>

                            <p className="mt-1 text-sm leading-relaxed text-gray-300">
                                Una buena administración de tus finanzas
                                comienza con pequeñas decisiones diarias.
                            </p>

                        </div>

                        <div className="self-end text-3xl sm:self-auto">
                            📈
                        </div>

                    </div>

                </section>
            )}

        </main>
    )
}