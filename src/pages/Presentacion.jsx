import { useEffect, useRef, useState } from 'react'

import {
    ArrowLeft,
    ArrowRight,
    Banknote,
    BarChart3,
    BookOpen,
    Check,
    CircleArrowRight,
    CircleDollarSign,
    ClipboardList,
    Container,
    Database,
    Files,
    GitBranch,
    LayoutDashboard,
    LineChart,
    MousePointerClick,
    PiggyBank,
    Server,
    Tags,
    Target,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react'

import DashboardPreview from '../components/DashboardPreview'
import logoColor from '../assets/remesa-smart.png'
import logoBlanco from '../assets/remesa-smart (blanco).png'

/**
 * Presentación comercial de RemesaSmart SV.
 *
 * Seis pantallas de altura completa pensadas para una exposición en línea.
 * Solo comunica funcionalidades que existen en el producto: "metas de ahorro"
 * todavía no tiene interfaz en el frontend, así que se rotula como
 * "interfaz en desarrollo" en lugar de presentarse como terminada.
 */

const SECCIONES = [
    'Portada',
    'Problema',
    'Solución',
    'Cómo funciona',
    'Beneficios',
    'Tecnología',
]

const PROBLEMAS = [
    {
        icono: Wallet,
        titulo: 'Gastos sin control',
        texto: 'El dinero se va sin saber exactamente en qué se gasta.',
    },
    {
        icono: CircleDollarSign,
        titulo: 'Saldo incierto',
        texto: 'Es difícil saber cuánto queda realmente disponible.',
    },
    {
        icono: PiggyBank,
        titulo: 'Ahorro sin plan',
        texto: 'No hay una meta clara ni un seguimiento del ahorro.',
    },
    {
        icono: Files,
        titulo: 'Información dispersa',
        texto: 'Los números del hogar quedan en varios lugares.',
    },
]

const CAPACIDADES = [
    'Registrar y controlar remesas.',
    'Administrare ingresos y gastos.',
    'Crear y controlar presupuestos.',
    'Establecer metas de ahorro.',
    'Visualizar el estado financiero del hogar.',
]

const PANTALLAS = [
    {
        icono: LayoutDashboard,
        nombre: 'Resumen financiero',
        detalle: 'Tarjetas y gráficas del hogar.',
    },
    {
        icono: Banknote,
        nombre: 'Remesas',
        detalle: 'Registro de remesas recibidas.',
    },
    {
        icono: TrendingUp,
        nombre: 'Ingresos',
        detalle: 'Entradas registradas del hogar.',
    },
    {
        icono: TrendingDown,
        nombre: 'Gastos',
        detalle: 'Salidas filtradas por categoría.',
    },
    {
        icono: Wallet,
        nombre: 'Presupuestos',
        detalle: 'Límites por categoría y periodo.',
    },
    {
        icono: BookOpen,
        nombre: 'Educación financiera',
        detalle: 'Tips para tomar mejores decisiones.',
    },
]

const PASOS = [
    {
        icono: Banknote,
        titulo: 'Recibe tu remesa',
        texto: 'Llega el dinero al hogar.',
    },
    {
        icono: ClipboardList,
        titulo: 'Registra ingresos y gastos',
        texto: 'Organiza cada movimiento.',
    },
    {
        icono: Wallet,
        titulo: 'Define tu presupuesto',
        texto: 'Fija límites y prioriza tus metas.',
        nota: 'metas: interfaz en desarrollo',
    },
    {
        icono: LineChart,
        titulo: 'Consulta tu progreso',
        texto: 'Decide con información real.',
    },
]

const BENEFICIOS = [
    {
        icono: BarChart3,
        titulo: 'Mayor visibilidad',
        texto: 'Las finanzas del hogar en una sola vista.',
    },
    {
        icono: Wallet,
        titulo: 'Mejor control',
        texto: 'Ingresos y gastos siempre al día.',
    },
    {
        icono: Target,
        titulo: 'Metas de ahorro',
        texto: 'Seguimiento de tus objetivos de ahorro.',
        nota: 'Interfaz en desarrollo',
    },
    {
        icono: Tags,
        titulo: 'Organización del hogar',
        texto: 'Decisiones financieras más ordenadas.',
    },
]

const TECNOLOGIA = [
    { icono: Server, etiqueta: '.NET 8 / C#' },
    { icono: LayoutDashboard, etiqueta: 'React + Vite' },
    { icono: Database, etiqueta: 'PostgreSQL' },
    { icono: Container, etiqueta: 'Docker' },
    { icono: GitBranch, etiqueta: 'GitHub Actions' },
]

const CHIP_EN_DESARROLLO =
    'inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700'

export default function Presentacion() {
    const contenedorRef = useRef(null)
    const seccionesRef = useRef([])

    const [actual, setActual] = useState(0)
    const [visitas, setVisitas] = useState(() =>
        SECCIONES.map((_, indice) => indice === 0)
    )

    /* ---------------------------------------------------------------
       Título del documento mientras dura la presentación.
    --------------------------------------------------------------- */
    useEffect(() => {
        const tituloAnterior = document.title
        document.title = 'RemesaSmart SV — Presentación'

        const overflowAnterior = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => {
            document.title = tituloAnterior
            document.body.style.overflow = overflowAnterior
        }
    }, [])

    /* ---------------------------------------------------------------
       Sección activa según la posición del scroll.
    --------------------------------------------------------------- */
    useEffect(() => {
        const contenedor = contenedorRef.current

        if (!contenedor) return undefined

        let cuadro = 0

        function actualizarSeccion() {
            cancelAnimationFrame(cuadro)

            cuadro = requestAnimationFrame(() => {
                const altura = contenedor.clientHeight || 1
                const indice = Math.min(
                    SECCIONES.length - 1,
                    Math.max(0, Math.round(contenedor.scrollTop / altura))
                )

                setActual((anterior) =>
                    anterior === indice ? anterior : indice
                )
            })
        }

        contenedor.addEventListener('scroll', actualizarSeccion, {
            passive: true,
        })
        actualizarSeccion()

        return () => {
            cancelAnimationFrame(cuadro)
            contenedor.removeEventListener('scroll', actualizarSeccion)
        }
    }, [])

    /* ---------------------------------------------------------------
       Reveal ligero: la sección se anima apenas empieza a entrar, nunca
       a mitad de camino (evita media pantalla en blanco al desplazar).
    --------------------------------------------------------------- */
    useEffect(() => {
        const contenedor = contenedorRef.current

        if (
            !contenedor ||
            typeof IntersectionObserver !== 'function'
        ) {
            setVisitas(SECCIONES.map(() => true))
            return undefined
        }

        const observador = new IntersectionObserver(
            (entradas) => {
                entradas.forEach((entrada) => {
                    if (!entrada.isIntersecting) return

                    const indice = Number(entrada.target.dataset.indice)

                    setVisitas((anterior) =>
                        anterior[indice]
                            ? anterior
                            : anterior.map((vista, posicion) =>
                                  posicion === indice ? true : vista
                              )
                    )
                })
            },
            { root: contenedor, threshold: 0.05 }
        )

        seccionesRef.current.forEach((seccion) => {
            if (seccion) observador.observe(seccion)
        })

        return () => observador.disconnect()
    }, [])

    function irA(indice) {
        const destino = seccionesRef.current[indice]

        if (!destino) return

        const reduceMovimiento =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches

        destino.scrollIntoView({
            behavior: reduceMovimiento ? 'auto' : 'smooth',
            block: 'start',
        })
    }

    /* ---------------------------------------------------------------
       Teclado: flechas, PageUp/PageDown, espacio, Inicio/Fin.
    --------------------------------------------------------------- */
    useEffect(() => {
        function alTeclar(evento) {
            const elemento = evento.target

            const enControl =
                elemento instanceof HTMLElement &&
                elemento.closest('button, a, input, textarea, select')

            const siguiente = [
                'ArrowRight',
                'ArrowDown',
                'PageDown',
                ' ',
            ].includes(evento.key)
            const anterior = ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(
                evento.key
            )

            if (!siguiente && !anterior && evento.key !== 'Home' && evento.key !== 'End') {
                return
            }

            // El espacio solo navega cuando no hay un control enfocado.
            if (evento.key === ' ' && enControl) return

            evento.preventDefault()

            if (evento.key === 'Home') {
                irA(0)
                return
            }

            if (evento.key === 'End') {
                irA(SECCIONES.length - 1)
                return
            }

            const destino = siguiente
                ? Math.min(SECCIONES.length - 1, actual + 1)
                : Math.max(0, actual - 1)

            irA(destino)
        }

        window.addEventListener('keydown', alTeclar)

        return () => window.removeEventListener('keydown', alTeclar)
    }, [actual])

    function animacion(indice) {
        const visible = visitas[indice]

        return [
            'transition-all duration-500 ease-out motion-reduce:transition-none',
            visible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100',
        ].join(' ')
    }

    function renderSeccion(indice, clases, contenido) {
        return (
            <section
                key={SECCIONES[indice]}
                ref={(elemento) => {
                    seccionesRef.current[indice] = elemento
                }}
                aria-label={`${indice + 1} de ${SECCIONES.length}: ${SECCIONES[indice]}`}
                data-indice={indice}
                className={`h-full snap-start overflow-y-auto ${clases}`}
            >
                <div className="flex min-h-full flex-col justify-center px-6 pb-28 pt-16 sm:px-10 lg:px-16">
                    {contenido}
                </div>
            </section>
        )
    }

    return (
        <div className="font-sans">
            {/* BARRA DE PROGRESO */}
            <div className="fixed inset-x-0 top-0 z-50 h-1 bg-slate-900/10">
                <div
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{
                        width: `${((actual + 1) / SECCIONES.length) * 100}%`,
                    }}
                />
            </div>

            <main
                ref={contenedorRef}
                className="h-screen snap-y snap-mandatory overflow-y-auto scroll-smooth"
            >
                {/* =====================================================
                    1 · PORTADA
                ====================================================== */}
                {renderSeccion(
                    0,
                    'bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50',
                    <>
                        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
                            <div>
                                <img
                                    src={logoColor}
                                    alt="RemesaSmart SV"
                                    className={`mb-7 h-11 w-auto sm:h-14 ${animacion(0)}`}
                                />

                                <h1
                                    className={`text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl ${animacion(0)}`}
                                >
                                    RemesaSmart SV
                                </h1>

                                <p
                                    className={`mt-4 text-lg font-semibold text-blue-700 sm:text-2xl ${animacion(0)}`}
                                >
                                    Convierte tus remesas en mejores
                                    decisiones financieras.
                                </p>

                                <p
                                    className={`mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg ${animacion(0)}`}
                                >
                                    Una solución digital para administrar
                                    remesas, organizar los gastos del hogar y
                                    alcanzar metas de ahorro.
                                </p>

                                <div
                                    className={`mt-8 flex flex-wrap items-center gap-4 ${animacion(0)}`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => irA(1)}
                                        className="inline-flex items-center gap-2 rounded-[9px] bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-[0_10px_25px_rgba(37,99,235,0.25)] transition hover:-translate-y-px hover:bg-blue-700 active:scale-[0.99]"
                                    >
                                        Conoce cómo funciona
                                        <ArrowRight size={18} strokeWidth={2.2} />
                                    </button>

                                    <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2.5 text-xs font-semibold text-slate-500 lg:inline-flex">
                                        <MousePointerClick size={15} />
                                        Usa ← → para navegar
                                    </span>
                                </div>
                            </div>

                            <div className={animacion(0)}>
                                <DashboardPreview />
                            </div>
                        </div>
                    </>
                )}

                {/* =====================================================
                    2 · EL PROBLEMA
                ====================================================== */}
                {renderSeccion(
                    1,
                    'bg-white',
                    <>
                        <div className="mx-auto w-full max-w-6xl">
                            <p
                                className={`text-xs font-bold uppercase tracking-[0.2em] text-blue-600 ${animacion(1)}`}
                            >
                                El problema
                            </p>

                            <h2
                                className={`mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl ${animacion(1)}`}
                            >
                                Recibir dinero no siempre significa saber cómo
                                administrarlo.
                            </h2>

                            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                {PROBLEMAS.map((problema, indice) => {
                                    const Icono = problema.icono

                                    return (
                                        <article
                                            key={problema.titulo}
                                            className={`rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.03)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)] ${animacion(1)}`}
                                        >
                                            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                                <Icono size={22} strokeWidth={1.9} />
                                            </span>

                                            <h3 className="text-base font-bold text-slate-900">
                                                {problema.titulo}
                                            </h3>

                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                {problema.texto}
                                            </p>
                                        </article>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* =====================================================
                    3 · LA SOLUCIÓN
                ====================================================== */}
                {renderSeccion(
                    2,
                    'bg-gradient-to-br from-slate-50 to-blue-50',
                    <>
                        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
                            <div>
                                <p
                                    className={`text-xs font-bold uppercase tracking-[0.2em] text-blue-600 ${animacion(2)}`}
                                >
                                    La solución
                                </p>

                                <h2
                                    className={`mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl ${animacion(2)}`}
                                >
                                    Todo el control financiero del hogar, en un
                                    solo lugar.
                                </h2>

                                <ul className="mt-7 flex flex-col gap-3.5">
                                    {CAPACIDADES.map((capacidad, indice) => (
                                        <li
                                            key={capacidad}
                                            className={`flex items-start gap-3 text-base text-slate-700 ${animacion(2)}`}
                                        >
                                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                                                <Check size={14} strokeWidth={3} />
                                            </span>

                                            <span className="leading-snug">
                                                {capacidad.replace('.', '')}
                                                {indice === 3 && (
                                                    <span className={`${CHIP_EN_DESARROLLO} ml-2 align-middle`}>
                                                        Interfaz en desarrollo
                                                    </span>
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {PANTALLAS.map((pantalla, indice) => {
                                    const Icono = pantalla.icono

                                    return (
                                        <article
                                            key={pantalla.nombre}
                                            className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.03)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 ${animacion(2)}`}
                                        >
                                            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                                                <Icono size={19} strokeWidth={1.9} />
                                            </span>

                                            <h3 className="text-sm font-bold text-slate-900">
                                                {pantalla.nombre}
                                            </h3>

                                            <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                                {pantalla.detalle}
                                            </p>
                                        </article>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* =====================================================
                    4 · ¿CÓMO FUNCIONA?
                ====================================================== */}
                {renderSeccion(
                    3,
                    'bg-white',
                    <>
                        <div className="mx-auto w-full max-w-6xl">
                            <div className="text-center">
                                <p
                                    className={`text-xs font-bold uppercase tracking-[0.2em] text-blue-600 ${animacion(3)}`}
                                >
                                    ¿Cómo funciona?
                                </p>

                                <h2
                                    className={`mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl ${animacion(3)}`}
                                >
                                    Un flujo simple, paso a paso.
                                </h2>
                            </div>

                            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {PASOS.map((paso, indice) => {
                                    const Icono = paso.icono

                                    return (
                                        <article
                                            key={paso.titulo}
                                            className={`relative rounded-2xl border border-slate-200 bg-slate-50 p-6 ${animacion(3)}`}
                                        >
                                            <div className="mb-5 flex items-center gap-3">
                                                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(37,99,235,0.30)]">
                                                    {indice + 1}
                                                </span>

                                                {indice < PASOS.length - 1 && (
                                                    <span className="hidden h-px flex-1 bg-blue-200 lg:block" />
                                                )}
                                            </div>

                                            <Icono
                                                size={26}
                                                strokeWidth={1.8}
                                                className="text-blue-700"
                                            />

                                            <h3 className="mt-4 text-base font-bold leading-snug text-slate-900">
                                                {paso.titulo}
                                            </h3>

                                            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                                                {paso.texto}
                                            </p>

                                            {paso.nota && (
                                                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                                    {paso.nota}
                                                </p>
                                            )}
                                        </article>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* =====================================================
                    5 · BENEFICIOS
                ====================================================== */}
                {renderSeccion(
                    4,
                    'bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50',
                    <>
                        <div className="mx-auto w-full max-w-6xl">
                            <div className="text-center">
                                <p
                                    className={`text-xs font-bold uppercase tracking-[0.2em] text-blue-600 ${animacion(4)}`}
                                >
                                    Beneficios
                                </p>

                                <h2
                                    className={`mx-auto mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl ${animacion(4)}`}
                                >
                                    Más control. Más organización. Más
                                    tranquilidad.
                                </h2>
                            </div>

                            <div className="mt-11 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                {BENEFICIOS.map((beneficio, indice) => {
                                    const Icono = beneficio.icono

                                    return (
                                        <article
                                            key={beneficio.titulo}
                                            className={`rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition duration-300 hover:-translate-y-1 ${animacion(4)}`}
                                        >
                                            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                                                <Icono size={24} strokeWidth={1.9} />
                                            </span>

                                            <h3 className="text-base font-bold text-slate-900">
                                                {beneficio.titulo}
                                            </h3>

                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                {beneficio.texto}
                                            </p>

                                            {beneficio.nota && (
                                                <span
                                                    className={`${CHIP_EN_DESARROLLO} mt-4`}
                                                >
                                                    {beneficio.nota}
                                                </span>
                                            )}
                                        </article>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* =====================================================
                    6 · TECNOLOGÍA + CIERRE
                ====================================================== */}
                {renderSeccion(
                    5,
                    'bg-[#123B8F]',
                    <>
                        <div className="mx-auto w-full max-w-4xl text-center">
                            <p
                                className={`text-xs font-bold uppercase tracking-[0.2em] text-blue-200 ${animacion(5)}`}
                            >
                                Tecnología
                            </p>

                            <ul
                                className={`mt-6 flex flex-wrap items-center justify-center gap-3 ${animacion(5)}`}
                            >
                                {TECNOLOGIA.map((tecnologia) => {
                                    const Icono = tecnologia.icono

                                    return (
                                        <li
                                            key={tecnologia.etiqueta}
                                            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                                        >
                                            <Icono size={16} strokeWidth={1.9} />
                                            {tecnologia.etiqueta}
                                        </li>
                                    )
                                })}
                            </ul>

                            <div className="mx-auto my-9 h-px w-24 bg-white/20" />

                            <img
                                src={logoBlanco}
                                alt="RemesaSmart SV"
                                className={`mx-auto h-12 w-auto sm:h-16 ${animacion(5)}`}
                            />

                            <h2
                                className={`mt-7 text-3xl font-extrabold tracking-tight text-white sm:text-4xl ${animacion(5)}`}
                            >
                                RemesaSmart SV
                            </h2>

                            <p
                                className={`mx-auto mt-4 max-w-2xl text-base leading-relaxed text-blue-100 sm:text-lg ${animacion(5)}`}
                            >
                                Una herramienta creada para ayudar a los hogares
                                salvadoreños a administrar mejor sus remesas y
                                construir una mejor organización financiera.
                            </p>

                            <div className={`mt-9 ${animacion(5)}`}>
                                <a
                                    href="/"
                                    className="inline-flex items-center gap-2 rounded-[9px] bg-white px-7 py-3.5 text-base font-bold text-[#123B8F] shadow-[0_10px_25px_rgba(0,0,0,0.20)] transition hover:-translate-y-px hover:bg-blue-50 active:scale-[0.99]"
                                >
                                    Conoce RemesaSmart SV
                                    <CircleArrowRight size={19} strokeWidth={2.2} />
                                </a>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* =======================================================
                NAVEGACIÓN
            ======================================================== */}
            <nav
                aria-label="Navegación de la presentación"
                className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200/80 bg-white/90 py-2.5 pl-3 pr-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur"
            >
                <button
                    type="button"
                    onClick={() => irA(actual - 1)}
                    disabled={actual === 0}
                    aria-label="Sección anterior"
                    title="Sección anterior"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                >
                    <ArrowLeft size={18} strokeWidth={2.2} />
                </button>

                <div className="flex items-center gap-2">
                    {SECCIONES.map((nombre, indice) => (
                        <button
                            key={nombre}
                            type="button"
                            onClick={() => irA(indice)}
                            aria-label={`Ir a ${nombre}`}
                            aria-current={indice === actual ? 'true' : undefined}
                            title={nombre}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                indice === actual
                                    ? 'w-6 bg-blue-600'
                                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                            }`}
                        />
                    ))}
                </div>

                <span className="hidden min-w-[9.5rem] pl-1 text-xs font-bold uppercase tracking-wide text-slate-500 sm:block">
                    {String(actual + 1).padStart(2, '0')} ·{' '}
                    {SECCIONES[actual]}
                </span>

                <button
                    type="button"
                    onClick={() => irA(actual + 1)}
                    disabled={actual === SECCIONES.length - 1}
                    aria-label="Sección siguiente"
                    title="Sección siguiente"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                >
                    <ArrowRight size={18} strokeWidth={2.2} />
                </button>
            </nav>
        </div>
    )
}
