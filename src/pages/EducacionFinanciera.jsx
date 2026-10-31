import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    BookOpen,
    ClipboardList,
    HandCoins,
    Heart,
    Lightbulb,
    Library,
    TrendingUp,
    TriangleAlert,
} from 'lucide-react'
import { educacionApi } from '../services/api'
import Notification from '../components/Notification'
import Loading from '../components/Loading'
import { EncabezadoSeccion } from '../components/ui/EncabezadoSeccion'
import { ChipIcono } from '../components/ui/ChipIcono'
import { CLASE_TARJETA } from '../components/ui/estilos'

export default function EducacionFinanciera() {
    const { t } = useTranslation()
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
                t('education.loadError')
            )
        } finally {
            setCargando(false)
        }
    }, [t])

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
                t('education.updated')
            )
        } catch (err) {
            setError(
                err.message ||
                t('education.updateError')
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
            <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#123B8F] via-[#1D4FA3] to-[#0B2E6B] p-5 text-white shadow-lg sm:p-8">

                <div className="max-w-3xl">

                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm sm:h-14 sm:w-14">
                        <Lightbulb size={28} strokeWidth={2} aria-hidden="true" />
                    </div>

                    <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">
                        {t('education.title')}
                    </h1>

                    <p className="mt-3 text-sm leading-relaxed text-blue-100 sm:text-base md:text-lg">
                        {t('education.description')}
                    </p>

                </div>

            </section>

            {/* INTRODUCCIÓN */}
            <section className={CLASE_TARJETA}>

                <EncabezadoSeccion
                    Icono={BookOpen}
                    tono="azul"
                    titulo={t('education.introTitle')}
                />

                <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                    {t('education.introText')}
                </p>

            </section>

            {/* TÍTULO DE CONSEJOS */}
            <EncabezadoSeccion
                Icono={ClipboardList}
                tono="ambar"
                titulo={t('education.tips')}
                subtitulo={t('education.recommendations')}
                extra={
                    <button
                        onClick={actualizarTips}
                        disabled={cargando || procesando}
                        className="w-full rounded-lg bg-blue-100 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2"
                    >
                        {procesando
                            ? t('common.procesando')
                            : t('common.actualizar')}
                    </button>
                }
            />

            {/* CARGANDO */}
            {cargando && (
                <Loading mensaje={t('education.loading')} />
            )}

            {/* ERROR */}
            {!cargando && error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">

                    <div className="flex items-start gap-3 sm:gap-4">

                        <div className="shrink-0 text-red-700">
                            <TriangleAlert size={24} aria-hidden="true" />
                        </div>

                        <div className="min-w-0 flex-1">

                            <h3 className="font-bold text-red-800">
                                {t('education.loadError')}
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
                                    ? t('education.trying')
                                    : t('education.retry')}
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* SIN TIPS */}
            {!cargando && !error && tips.length === 0 && (
                <div className={`${CLASE_TARJETA} text-center sm:py-10`}>

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 sm:h-16 sm:w-16">
                        <Library size={26} className="text-slate-500" aria-hidden="true" />
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-gray-800 sm:text-xl">
                        {t('education.emptyTitle')}
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 sm:text-base">
                        {t('education.empty')}
                    </p>

                </div>
            )}

            {/* TARJETAS */}
            {!cargando && !error && tips.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">

                    {tips.map((tip) => (
                        <article
                            key={tip.idTip}
                            className={`group relative overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl ${CLASE_TARJETA}`}
                        >

                            {/* BARRA SUPERIOR */}
                            <div className="-mx-6 -mt-6 h-2 bg-gradient-to-r from-[#123B8F] to-[#1D4FA3]" />

                            <div className="mt-5 sm:mt-6">

                                {/* ICONO */}
                                <div className="mb-5 flex items-center justify-between gap-3">

                                    <ChipIcono
                                        Icono={HandCoins}
                                        tono="azul"
                                        className="transition group-hover:scale-110"
                                    />

                                    <span className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                        {t('education.tip')}
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

                            <h3 className="flex items-center gap-2 text-base font-bold sm:text-lg">
                                <Heart size={18} className="text-green-400" aria-hidden="true" />
                                {t('education.footerTitle')}
                            </h3>

                            <p className="mt-1 text-sm leading-relaxed text-gray-300">
                                {t('education.footerText')}
                            </p>

                        </div>

                        <div className="self-end text-green-400 sm:self-auto">
                            <TrendingUp size={28} aria-hidden="true" />
                        </div>

                    </div>

                </section>
            )}

        </main>
    )
}
