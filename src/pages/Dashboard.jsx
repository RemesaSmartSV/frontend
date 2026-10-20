import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts'

import {
    categoriasApi,
    movimientosApi,
    ahorroApi,
    alertasApi,
} from '../services/api'

import Notification from '../components/Notification'
import Loading from '../components/Loading'
import LeyendaOrdenada from '../components/LeyendaOrdenada'
import { formatearMoneda, formatearNumero, formatearFecha, obtenerLocale, parsearFechaLocal, obtenerFechaHoy } from '../utils/formato'

const COLORES_CATEGORIAS = [
    '#7c3aed',
    '#2563eb',
    '#16a34a',
    '#dc2626',
    '#f59e0b',
    '#0891b2',
    '#db2777',
    '#65a30d',
]

// Paleta del proyecto (Index.css): success, warning y danger. El ahorro usa
// el naranja --color-warning para no confundirse ni con el verde (ingreso)
// ni con el rojo (gasto).
const COLOR_INGRESO = '#16a34a'
const COLOR_AHORRO = '#f59e0b'
const COLOR_GASTO = '#dc2626'

function nombreMes(anio, mes, idioma) {
    const fecha = new Date(anio, mes - 1, 1)

    return fecha.toLocaleDateString(obtenerLocale(idioma), {
        month: 'long',
        year: 'numeric',
    })
}

const MODOS_PERIODO = ['dia', 'semana', 'mes', 'anio', 'historial']

/*
 * ==========================================
 * PERÍODOS EN ZONA HORARIA LOCAL
 * ==========================================
 *
 * El usuario opera en El Salvador (UTC-6). Date de JS es local al navegador,
 * así que todos los cálculos de período (día, semana lunes→domingo, mes y
 * año) se hacen en la zona horaria local; "hoy" es la fecha local. Al salir
 * hacia el backend se envían como ISO UTC vía toISOString(). El fin del
 * rango es el último instante del día final (23:59:59.999 local) porque el
 * backend compara el DateTime completo (m.Fecha <= fechaFin).
 */

function aIsoLocal(fecha) {
    const anio = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')

    return `${anio}-${mes}-${dia}`
}

function medianocheLocal(isoLocal) {
    const [anio, mes, dia] = String(isoLocal)
        .split('-')
        .map(Number)

    return new Date(anio, mes - 1, dia)
}

function finDeDia(fecha) {
    return new Date(
        fecha.getFullYear(),
        fecha.getMonth(),
        fecha.getDate(),
        23,
        59,
        59,
        999
    )
}

// Rango [inicio, fin] en Date locales para el modo y fecha ancla dados.
// Devuelve null en 'historial' (sin filtro de período).
function rangoDePeriodo(modo, isoAncla) {
    if (modo === 'historial') {
        return null
    }

    const ancla = medianocheLocal(isoAncla)

    if (modo === 'dia') {
        return { inicio: ancla, fin: finDeDia(ancla) }
    }

    if (modo === 'semana') {
        // getDay(): 0=domingo…6=sábado. La semana corre lunes→domingo.
        const offsetLunes = (ancla.getDay() + 6) % 7
        const lunes = new Date(
            ancla.getFullYear(),
            ancla.getMonth(),
            ancla.getDate() - offsetLunes
        )
        const domingo = new Date(
            lunes.getFullYear(),
            lunes.getMonth(),
            lunes.getDate() + 6
        )

        return { inicio: lunes, fin: finDeDia(domingo) }
    }

    if (modo === 'mes') {
        return {
            inicio: new Date(ancla.getFullYear(), ancla.getMonth(), 1),
            fin: finDeDia(
                new Date(ancla.getFullYear(), ancla.getMonth() + 1, 0)
            ),
        }
    }

    // anio
    return {
        inicio: new Date(ancla.getFullYear(), 0, 1),
        fin: finDeDia(new Date(ancla.getFullYear(), 11, 31)),
    }
}

// Etiqueta legible del período activo, para el selector y para interpolar
// en los empty states (p. ej. «No hay nada registrado en {{periodo}}»).
function etiquetaPeriodo(modo, isoAncla, idioma, t) {
    if (modo === 'historial') {
        return t('dashboard.todoHistorial')
    }

    const ancla = medianocheLocal(isoAncla)

    if (modo === 'dia') {
        return formatearFecha(ancla, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    if (modo === 'semana') {
        const rango = rangoDePeriodo('semana', isoAncla)

        return `${formatearFecha(rango.inicio, {
            day: 'numeric',
            month: 'short',
        })} – ${formatearFecha(rango.fin, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })}`
    }

    if (modo === 'mes') {
        return nombreMes(
            ancla.getFullYear(),
            ancla.getMonth() + 1,
            idioma
        )
    }

    // anio
    return String(ancla.getFullYear())
}

// Navegación ‹ › del período activo: mueve la fecha ancla según la
// granularidad (día, ±1 semana, mes o año). No aplica en 'historial'.
function moverFechaAncla(modo, isoAncla, direccion) {
    const ancla = medianocheLocal(isoAncla)

    if (modo === 'dia') {
        return aIsoLocal(
            new Date(
                ancla.getFullYear(),
                ancla.getMonth(),
                ancla.getDate() + direccion
            )
        )
    }

    if (modo === 'semana') {
        return aIsoLocal(
            new Date(
                ancla.getFullYear(),
                ancla.getMonth(),
                ancla.getDate() + direccion * 7
            )
        )
    }

    if (modo === 'mes') {
        return aIsoLocal(
            new Date(
                ancla.getFullYear(),
                ancla.getMonth() + direccion,
                1
            )
        )
    }

    // anio
    return aIsoLocal(
        new Date(ancla.getFullYear() + direccion, ancla.getMonth(), 1)
    )
}

const claveDia = (fecha) =>
    `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`

const claveMes = (fecha) =>
    `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`

/*
 * ==========================================
 * AGREGACIÓN PARA LA GRÁFICA ADAPTATIVA
 * ==========================================
 */

function bucketVacio(clave, etiqueta) {
    return { clave, etiqueta, ingresos: 0, ahorro: 0, gastos: 0 }
}

function acumularMovimiento(bucket, movimiento) {
    const monto = Number(movimiento.monto) || 0

    if (movimiento.tipo === 'Ingreso') {
        bucket.ingresos += monto
    } else if (movimiento.tipo === 'Ahorro') {
        bucket.ahorro += monto
    } else if (movimiento.tipo === 'Gasto') {
        bucket.gastos += monto
    }
}

// Buckets por día entre dos fechas locales (inclusive), etiquetados con la
// función recibida (día del mes, nombre corto del día de la semana, etc.).
function bucketsPorDia(desde, hasta, etiquetaDe) {
    const buckets = []
    const actual = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate())
    const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate())

    while (actual <= fin) {
        buckets.push(bucketVacio(claveDia(actual), etiquetaDe(actual)))
        actual.setDate(actual.getDate() + 1)
    }

    return buckets
}

// Rellena los buckets con los movimientos (ya filtrados por el backend al
// rango del período) usando la clave de fecha indicada.
function llenarBucketsPor(buckets, movimientos, claveDeFecha) {
    const porClave = new Map(
        buckets.map((bucket) => [bucket.clave, bucket])
    )

    movimientos.forEach((movimiento) => {
        const fecha = parsearFechaLocal(movimiento.fecha)

        if (!fecha || Number.isNaN(fecha.getTime())) {
            return
        }

        const bucket = porClave.get(claveDeFecha(fecha))

        if (bucket) {
            acumularMovimiento(bucket, movimiento)
        }
    })

    return buckets
}

export default function Dashboard() {
    const { t, i18n } = useTranslation()

    const [movimientos, setMovimientos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [resumen, setResumen] = useState({
        totalIngresos: 0,
        totalGastos: 0,
        totalAhorro: 0,
        balance: 0,
    })
    const [metas, setMetas] = useState([])
    const [alertas, setAlertas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)

    // Granularidad del período: 'dia' | 'semana' | 'mes' | 'anio' |
    // 'historial'. La fecha ancla ('YYYY-MM-DD' local) es el punto de
    // referencia para el rango y la navegación ‹ ›; en 'historial' no filtra.
    const [modoPeriodo, setModoPeriodo] = useState('historial')
    const [fechaAncla, setFechaAncla] = useState(obtenerFechaHoy())

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    // Rango efectivo del modo activo (Date locales). Memoizado a partir de
    // primitivos para que su referencia sea estable en cargarDatos.
    const rangoPeriodo = useMemo(
        () => rangoDePeriodo(modoPeriodo, fechaAncla),
        [modoPeriodo, fechaAncla]
    )

    // Parámetros de rango en ISO UTC para la API (ver comentario de zonas).
    const parametrosRango = useMemo(() => {
        if (!rangoPeriodo) {
            return {}
        }

        return {
            fechaInicio: rangoPeriodo.inicio.toISOString(),
            fechaFin: rangoPeriodo.fin.toISOString(),
        }
    }, [rangoPeriodo])

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true)
            setError('')

            const ancla = medianocheLocal(fechaAncla)

            // El mes conserva el filtro histórico anio+mes del resumen (el
            // backend lo entiende igual); el resto de los períodos filtran
            // con el rango ISO UTC. La lista siempre se pide con el rango.
            //
            // Ahorro y alertas son complementarios: si uno falla, el dashboard
            // sigue mostrando el resto (promesa propia con catch).
            const [
                data,
                resumenData,
                categoriasData,
                metasData,
                alertasData,
            ] = await Promise.all([
                movimientosApi.listar(parametrosRango),
                modoPeriodo === 'mes'
                    ? movimientosApi.resumen(
                          ancla.getFullYear(),
                          ancla.getMonth() + 1
                      )
                    : movimientosApi.resumen(
                          undefined,
                          undefined,
                          parametrosRango
                      ),
                categoriasApi.listar(),
                ahorroApi.listarMetas().catch(() => []),
                alertasApi
                    .listarPorPeriodo(
                        rangoPeriodo?.inicio ??
                            new Date(ancla.getFullYear(), ancla.getMonth(), 1),
                        rangoPeriodo?.fin ??
                            new Date(ancla.getFullYear(), ancla.getMonth() + 1, 0)
                    )
                    .catch(() => []),
            ])

            setMovimientos(data)
            setResumen(resumenData)
            setCategorias(
                Array.isArray(categoriasData) ? categoriasData : []
            )
            setMetas(Array.isArray(metasData) ? metasData : [])
            setAlertas(Array.isArray(alertasData) ? alertasData : [])
        } catch (err) {
            setError(
                err.message ||
                t('dashboard.loadError')
            )
        } finally {
            setCargando(false)
        }
    }, [modoPeriodo, fechaAncla, rangoPeriodo, parametrosRango, t])

    useEffect(() => {
        cargarDatos()
    }, [cargarDatos])

    const actualizarDashboard = useCallback(async () => {
        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            await cargarDatos()

            setMensaje(
                t('dashboard.updated')
            )
        } catch (err) {
            setError(err.message)
        } finally {
            setProcesando(false)
        }
    }, [cargarDatos, t])

    // Todos los ingresos, incluyendo las remesas
    const ingresos = Number(resumen.totalIngresos || 0)

    // Todos los gastos
    const gastos = Number(resumen.totalGastos || 0)

    // Ahorro del periodo: suma de los aportes a metas. Regla de negocio
    // «ingreso y ahorro por separado»: el aporte no descuenta de Ingresos.
    const ahorro = Number(resumen.totalAhorro || 0)

    // La lista ya viene filtrada al rango del período por el backend, así
    // que alcanza con marcar las remesas; no hace falta un filtro de fecha
    // extra en el cliente.
    const remesas = useMemo(() => {
        return movimientos
            .filter(
                (m) =>
                    m.tipo === 'Ingreso' &&
                    m.origenEmisora
            )
            .reduce(
                (total, m) =>
                    total + Number(m.monto || 0),
                0
            )
    }, [movimientos])

    // Ahorro consolidado de las metas del hogar (saldo actual, no flujo).
    // Se usa como dato complementario del KPI de ahorro solo en 'historial';
    // con un período activo el subtítulo muestra los aportes del período
    // (aportesPorMeta), porque el saldo consolidado no se puede filtrar.
    const ahorroTotal = useMemo(() => {
        return metas.reduce(
            (total, meta) => total + Number(meta.montoActual || 0),
            0
        )
    }, [metas])

    // ---- Datos del enlace ingresos ↔ ahorro (tarjeta del período) ----
    const hayFiltroPeriodo = modoPeriodo !== 'historial'

    const ingresosSalario = Number(resumen.ingresosSalario || 0)

    const aportesPeriodo = useMemo(
        () =>
            Array.isArray(resumen.aportesPorMeta)
                ? resumen.aportesPorMeta
                : [],
        [resumen]
    )

    const aportesTotal = useMemo(
        () =>
            aportesPeriodo.reduce(
                (total, aporte) =>
                    total + Number(aporte.monto || 0),
                0
            ),
        [aportesPeriodo]
    )

    // % de ahorro sobre los ingresos; null si no hay ingresos (evita la
    // división por cero y se muestra como mensaje alternativo).
    const porcentajeAhorro =
        ingresos > 0 ? (ahorro / ingresos) * 100 : null

    // Etiqueta del período activo (selector + empty states interpolados).
    const etiquetaActiva = useMemo(
        () => etiquetaPeriodo(modoPeriodo, fechaAncla, i18n.language, t),
        [modoPeriodo, fechaAncla, i18n.language, t]
    )

    // Un período está vacío si el backend no encontró ni movimientos ni
    // aportes en el rango. Se usa '=== false' para no confundir undefined
    // (mocks/contratos viejos del resumen) con un período vacío real.
    const periodoVacio = hayFiltroPeriodo && resumen.tieneDatos === false

    const listaVacia = movimientos.length === 0

    function navegarPeriodo(direccion) {
        if (modoPeriodo === 'historial') {
            return
        }

        setFechaAncla(
            moverFechaAncla(modoPeriodo, fechaAncla, direccion)
        )
    }

    // Balance disponible. El backend ya devuelve Ingresos - Gastos - Ahorro;
    // el cálculo local es solo un respaldo si el campo no viniera.
    const balance = Number.isFinite(Number(resumen.balance))
        ? Number(resumen.balance)
        : ingresos - gastos - ahorro

    const movimientosRecientes = useMemo(() => {
        return [...movimientos]
            .filter((movimiento) => {
                return (
                    parsearFechaLocal(movimiento.fecha) !== null
                )
            })
            .sort((a, b) => {
                return (
                    parsearFechaLocal(b.fecha) -
                    parsearFechaLocal(a.fecha)
                )
            })
            .slice(0, 5)
    }, [movimientos])

    /*
     * ==========================================
     * DATOS PARA GRÁFICA DE INGRESOS Y GASTOS
     * ==========================================
     */

    // Modo 'historial': como siempre, los últimos 6 meses presentes en la
    // lista completa (sin filtro de período).
    const datosHistorial = useMemo(() => {
        const meses = {}

        movimientos.forEach((movimiento) => {
            const fecha = parsearFechaLocal(movimiento.fecha)

            if (!fecha || Number.isNaN(fecha.getTime())) {
                return
            }

            const clave =
                `${fecha.getFullYear()}-${String(
                    fecha.getMonth() + 1
                ).padStart(2, '0')}`

            if (!meses[clave]) {
                meses[clave] = {
                    clave,
                    etiqueta: fecha.toLocaleDateString(
                        obtenerLocale(i18n.language),
                        {
                            month: 'short',
                            year: 'numeric',
                        }
                    ),
                    ingresos: 0,
                    ahorro: 0,
                    gastos: 0,
                }
            }

            const monto =
                Number(movimiento.monto) || 0

            if (
                movimiento.tipo ===
                'Ingreso'
            ) {
                meses[clave].ingresos += monto
            }

            if (
                movimiento.tipo ===
                'Ahorro'
            ) {
                meses[clave].ahorro += monto
            }

            if (
                movimiento.tipo ===
                'Gasto'
            ) {
                meses[clave].gastos += monto
            }
        })

        return Object.values(meses)
            .sort(
                (a, b) =>
                    a.clave.localeCompare(
                        b.clave
                    )
            )
            .slice(-6)
    }, [movimientos, i18n.language])

    // Gráfica adaptativa por granularidad (agregación en cliente sobre la
    // lista del rango): 'dia' no usa barras (devuelve null y se muestra un
    // resumen de totales); semana = 7 barras lun→dom; mes = barras por día;
    // año = 12 barras por mes; historial = últimos 6 meses.
    const datosGrafica = useMemo(() => {
        const locale = obtenerLocale(i18n.language)

        if (modoPeriodo === 'dia') {
            return null
        }

        if (modoPeriodo === 'semana') {
            const rango = rangoDePeriodo('semana', fechaAncla)

            return llenarBucketsPor(
                bucketsPorDia(
                    rango.inicio,
                    rango.fin,
                    (fecha) =>
                        fecha.toLocaleDateString(locale, {
                            weekday: 'short',
                        })
                ),
                movimientos,
                claveDia
            )
        }

        if (modoPeriodo === 'mes') {
            const ancla = medianocheLocal(fechaAncla)

            return llenarBucketsPor(
                bucketsPorDia(
                    ancla,
                    new Date(
                        ancla.getFullYear(),
                        ancla.getMonth() + 1,
                        0
                    ),
                    (fecha) => String(fecha.getDate())
                ),
                movimientos,
                claveDia
            )
        }

        if (modoPeriodo === 'anio') {
            const ancla = medianocheLocal(fechaAncla)
            const buckets = []

            for (let mesIdx = 0; mesIdx < 12; mesIdx += 1) {
                buckets.push(
                    bucketVacio(
                        `${ancla.getFullYear()}-${String(mesIdx + 1).padStart(2, '0')}`,
                        new Date(ancla.getFullYear(), mesIdx, 1)
                            .toLocaleDateString(locale, {
                                month: 'short',
                            })
                            .replace(/\./g, '')
                    )
                )
            }

            return llenarBucketsPor(
                buckets,
                movimientos,
                claveMes
            )
        }

        return datosHistorial
    }, [modoPeriodo, fechaAncla, movimientos, i18n.language, datosHistorial])

    /*
     * ==========================================
     * OBTENER NOMBRE DE CATEGORÍA
     * ==========================================
     */

    const obtenerNombreCategoria =
        useCallback(
            (idCategoria) => {
                const categoria =
                    categorias.find(
                        (c) =>
                            c.idCategoria ===
                            idCategoria
                    )

                return categoria?.nombre || t('dashboard.noCategory')
            },
            [categorias, t]
        )

    /*
     * ==========================================
     * DATOS PARA GRÁFICA DE GASTOS
     * POR CATEGORÍA
     * ==========================================
     */

    const gastosPorCategoria =
        useMemo(() => {
            const agrupados = {}

            movimientos
                .filter(
                    (m) =>
                        m.tipo ===
                        'Gasto'
                )
                .forEach((gasto) => {
                    const nombre =
                        obtenerNombreCategoria(
                            gasto.idCategoria
                        )

                    const monto =
                        Number(
                            gasto.monto
                        ) || 0

                    agrupados[nombre] =
                        (agrupados[nombre] ||
                            0) + monto
                })

            return Object.entries(
                agrupados
            )
                .map(
                    ([
                        nombre,
                        monto,
                    ]) => ({
                        nombre,
                        monto,
                    })
                )
                .sort(
                    (a, b) =>
                        b.monto -
                        a.monto
                )
        }, [
            movimientos,
            obtenerNombreCategoria,
        ])

    // ¿La gráfica de barras del período no tiene ninguna barra con datos?
    // (p. ej. la lista vino vacía o solo con fechas inválidas).
    const graficaSinBarras =
        datosGrafica !== null &&
        datosGrafica.every(
            (bucket) =>
                bucket.ingresos === 0 &&
                bucket.ahorro === 0 &&
                bucket.gastos === 0
        )

    if (cargando) {
        return (
            <main className="mx-auto w-full max-w-5xl p-4 font-sans text-slate-800 sm:p-6 lg:p-10">
                <Loading mensaje={t('dashboard.loading')} />
            </main>
        )
    }

    return (
        <main className="mx-auto w-full max-w-6xl p-4 font-sans text-slate-800 sm:p-6 lg:p-10">

            {/* ================================
                NOTIFICACIONES
            ================================= */}

            {mensaje && (
                <Notification
                    tipo="success"
                    mensaje={mensaje}
                    onClose={() =>
                        setMensaje('')
                    }
                />
            )}

            {error && (
                <Notification
                    tipo="error"
                    mensaje={error}
                    onClose={() =>
                        setError('')
                    }
                />
            )}

            {/* ================================
                ENCABEZADO
            ================================= */}

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                        {t('dashboard.titulo')}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        {t('dashboard.subtitulo')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Granularidad: Día | Semana | Mes | Año | Historial */}
                    <div
                        role="group"
                        aria-label={t('dashboard.periodos.grupo')}
                        className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1"
                    >
                        {MODOS_PERIODO.map((modo) => (
                            <button
                                key={modo}
                                type="button"
                                onClick={() =>
                                    setModoPeriodo(modo)
                                }
                                aria-pressed={
                                    modoPeriodo === modo
                                }
                                className={`rounded-md px-2.5 py-1 text-sm font-semibold transition ${
                                    modoPeriodo === modo
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                {t(`dashboard.periodos.${modo}`)}
                            </button>
                        ))}
                    </div>

                    {/* Navegación ‹ › del período activo (inactiva en Historial) */}
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                        <button
                            type="button"
                            onClick={() => navegarPeriodo(-1)}
                            disabled={modoPeriodo === 'historial'}
                            aria-label={t('dashboard.periodos.anterior')}
                            className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                            ‹
                        </button>

                        <span className="min-w-[9rem] px-2 text-center text-sm font-semibold text-slate-700">
                            {etiquetaActiva}
                        </span>

                        <button
                            type="button"
                            onClick={() => navegarPeriodo(1)}
                            disabled={modoPeriodo === 'historial'}
                            aria-label={t('dashboard.periodos.siguiente')}
                            className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                            ›
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={actualizarDashboard}
                        disabled={procesando}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {procesando
                            ? t('common.procesando')
                            : t('common.actualizar')}
                    </button>
                </div>
            </div>

            {/* ================================
                ENLACE INGRESOS ↔ AHORRO
            ================================= */}

            <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Enlace del período: ingresos (y cuánto de Salario) vs ahorro
                    (y su % sobre los ingresos), con la aclaración de que el
                    ahorro ya está descontado del balance. */}

                <div className="card p-5">

                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-bold text-slate-800">
                            {t('dashboard.periodos.enlaceTitulo')}
                        </h2>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {etiquetaActiva}
                        </span>
                    </div>

                    {periodoVacio ? (
                        <p className="py-4 text-center text-sm text-slate-500">
                            {t('dashboard.periodos.sinDatos', {
                                periodo: etiquetaActiva,
                            })}
                        </p>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                                    {t('dashboard.periodos.ingresosPeriodo')}
                                </p>

                                <p className="mt-1 text-2xl font-bold tabular-nums text-green-700">
                                    {formatearMoneda(ingresos)}
                                </p>

                                <p className="mt-1 text-sm text-green-700/80">
                                    {t('dashboard.periodos.deSalario')}:{' '}
                                    {formatearMoneda(ingresosSalario)}
                                </p>
                            </div>

                            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                    {t('dashboard.periodos.ahorroPeriodo')}
                                </p>

                                <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
                                    {formatearMoneda(ahorro)}
                                </p>

                                <p className="mt-1 text-sm text-amber-700/80">
                                    {porcentajeAhorro === null
                                        ? t('dashboard.periodos.sinIngresos')
                                        : t('dashboard.periodos.porcentajeIngresos', {
                                              porcentaje: formatearNumero(
                                                  porcentajeAhorro,
                                                  {
                                                      maximumFractionDigits: 1,
                                                  }
                                              ),
                                          })}
                                </p>
                            </div>

                            <p className="text-xs leading-5 text-slate-500">
                                {t('dashboard.periodos.ahorroYaDescontado')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Aportes por meta del período */}

                <div className="card p-5">

                    <h2 className="mb-4 text-lg font-bold text-slate-800">
                        {t('dashboard.periodos.aportesPorMeta')}
                    </h2>

                    {periodoVacio ? (
                        <p className="py-4 text-center text-sm text-slate-500">
                            {t('dashboard.periodos.sinDatos', {
                                periodo: etiquetaActiva,
                            })}
                        </p>
                    ) : aportesPeriodo.length === 0 ? (
                        <p className="py-4 text-center text-sm text-slate-500">
                            {t('dashboard.periodos.sinAportes', {
                                periodo: etiquetaActiva,
                            })}
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {aportesPeriodo.map((aporte) => {
                                const monto = Number(aporte.monto) || 0
                                const maximo = Math.max(
                                    ...aportesPeriodo.map(
                                        (a) => Number(a.monto) || 0
                                    )
                                )
                                const barra =
                                    maximo > 0
                                        ? (monto / maximo) * 100
                                        : 0

                                return (
                                    <li
                                        key={aporte.idMeta}
                                        className="rounded-lg border border-slate-100 p-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="truncate text-sm font-medium text-slate-800">
                                                {aporte.titulo}
                                            </p>

                                            <p className="text-sm font-bold tabular-nums text-amber-700">
                                                {formatearMoneda(monto)}
                                            </p>
                                        </div>

                                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                            <div
                                                className="h-full rounded-full bg-amber-500"
                                                style={{
                                                    width: `${barra}%`,
                                                }}
                                            />
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
            </section>

            {/* ================================
                TARJETAS RESUMEN
                (si el período está vacío se muestra un empty state claro
                en lugar de montos en $0.00)
            ================================= */}

            {periodoVacio ? (
                <section className="card p-8 text-center">
                    <p className="text-sm text-slate-500">
                        {t('dashboard.periodos.sinDatos', {
                            periodo: etiquetaActiva,
                        })}
                    </p>
                </section>
            ) : (
                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                    {/* INGRESOS */}

                    <div className="flex min-w-0 flex-col rounded-xl border border-green-100 bg-green-50 p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                            {t('dashboard.ingresos')}
                        </p>

                        <p className="mt-2 text-2xl font-bold tabular-nums text-green-700">
                            {formatearMoneda(
                                ingresos
                            )}
                        </p>
                    </div>

                    {/* REMESAS */}

                    <div className="flex min-w-0 flex-col rounded-xl border border-violet-100 bg-violet-50 p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                            {t('dashboard.remesas')}
                        </p>

                        <p className="mt-2 text-2xl font-bold tabular-nums text-violet-700">
                            {formatearMoneda(
                                remesas
                            )}
                        </p>
                    </div>

                    {/* AHORRO: el flujo del periodo, el mismo que descuenta el
                        balance. Con período activo el subtítulo muestra los
                        aportes a metas del período; en historial, el saldo
                        consolidado de las metas. */}

                    <div className="flex min-w-0 flex-col rounded-xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            {t('dashboard.ahorro')}
                        </p>

                        <p className="mt-2 text-2xl font-bold tabular-nums text-amber-700">
                            {formatearMoneda(
                                ahorro
                            )}
                        </p>

                        <p className="mt-1 truncate text-xs text-amber-700/80">
                            {hayFiltroPeriodo
                                ? `${t('dashboard.periodos.aportesPorMeta')}: ${formatearMoneda(aportesTotal)}`
                                : `${t('dashboard.ahorroSaldoMetas')}: ${formatearMoneda(ahorroTotal)}`}
                        </p>
                    </div>

                    {/* GASTOS */}

                    <div className="flex min-w-0 flex-col rounded-xl border border-red-100 bg-red-50 p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                            {t('dashboard.gastos')}
                        </p>

                        <p className="mt-2 text-2xl font-bold tabular-nums text-red-700">
                            {formatearMoneda(
                                gastos
                            )}
                        </p>
                    </div>

                    {/* BALANCE */}

                    <div
                        className={`flex min-w-0 flex-col rounded-xl border p-5 shadow-sm ${
                            balance >= 0
                                ? 'border-blue-100 bg-blue-50'
                                : 'border-red-100 bg-red-50'
                        }`}
                    >
                        <p
                            className={`text-xs font-semibold uppercase tracking-wide ${
                                balance >= 0
                                    ? 'text-blue-700'
                                    : 'text-red-700'
                            }`}
                        >
                            {t('dashboard.balance')}
                        </p>

                        <p
                            className={`mt-2 text-2xl font-bold tabular-nums ${
                                balance >= 0
                                    ? 'text-blue-700'
                                    : 'text-red-700'
                            }`}
                        >
                            {formatearMoneda(
                                balance
                            )}
                        </p>
                    </div>
                </section>
            )}

            {/* ================================
                GRÁFICAS
            ================================= */}

            <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* GRÁFICA INGRESOS VS GASTOS (adaptativa por granularidad) */}

                <div className="card p-5">

                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-800">
                            {t('dashboard.flujoMensual')}
                        </h2>

                        <p className="text-sm text-slate-500">
                            {hayFiltroPeriodo
                                ? t('dashboard.periodos.flujoPeriodoSubtitulo')
                                : t('dashboard.lastMonths')}
                        </p>
                    </div>

                    {modoPeriodo === 'dia' ? (
                        /* Día: sin gráfica de barras; se muestra un estado
                           simple con los totales del día (la lista de
                           movimientos ya está más abajo). */
                        periodoVacio ? (
                            <div className="flex h-72 items-center justify-center px-4 text-center text-sm text-slate-500">
                                {t('dashboard.periodos.sinDatos', {
                                    periodo: etiquetaActiva,
                                })}
                            </div>
                        ) : (
                            <div className="flex h-72 flex-col items-center justify-center gap-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {t('dashboard.periodos.diaTotales')}
                                </p>

                                <div className="flex flex-wrap items-center justify-center gap-8">
                                    <div className="text-center">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                                            {t('dashboard.ingresos')}
                                        </p>
                                        <p className="mt-1 text-xl font-bold tabular-nums text-green-700">
                                            {formatearMoneda(ingresos)}
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                            {t('dashboard.ahorro')}
                                        </p>
                                        <p className="mt-1 text-xl font-bold tabular-nums text-amber-700">
                                            {formatearMoneda(ahorro)}
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                                            {t('dashboard.gastos')}
                                        </p>
                                        <p className="mt-1 text-xl font-bold tabular-nums text-red-700">
                                            {formatearMoneda(gastos)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : periodoVacio ||
                      (hayFiltroPeriodo &&
                          (listaVacia || graficaSinBarras)) ? (
                        <div className="flex h-72 items-center justify-center px-4 text-center text-sm text-slate-500">
                            {periodoVacio
                                ? t('dashboard.periodos.sinDatos', {
                                      periodo: etiquetaActiva,
                                  })
                                : t('dashboard.periodos.sinMovimientos', {
                                      periodo: etiquetaActiva,
                                  })}
                        </div>
                    ) : datosGrafica.length === 0 ? (
                        <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                            {t('dashboard.insufficientChartData')}
                        </div>
                    ) : (
                        <div className="h-72 w-full">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <BarChart
                                    data={
                                        datosGrafica
                                    }
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: 10,
                                        bottom: 10,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="etiqueta"
                                    />

                                    <YAxis tickFormatter={(value) => formatearNumero(value)} />

                                    <Tooltip
                                        formatter={(
                                            value
                                        ) =>
                                            formatearMoneda(
                                                value
                                            )
                                        }
                                    />

                                    {/* Recharts ordena la leyenda
                                        alfabéticamente por el name, así
                                        que sale Ahorro, Gastos, Ingresos.
                                        LeyendaOrdenada la toma y devuelve
                                        el orden de negocio. */}
                                    <Legend content={LeyendaOrdenada} />

                                    {/* Orden visual: ingresos (verde), ahorro
                                        (naranja) y gastos (rojo). */}
                                    <Bar
                                        dataKey="ingresos"
                                        name={t('dashboard.ingresos')}
                                        fill={COLOR_INGRESO}
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0,
                                        ]}
                                    />

                                    <Bar
                                        dataKey="ahorro"
                                        name={t('dashboard.ahorro')}
                                        fill={COLOR_AHORRO}
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0,
                                        ]}
                                    />

                                    <Bar
                                        dataKey="gastos"
                                        name={t('dashboard.gastos')}
                                        fill={COLOR_GASTO}
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0,
                                        ]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* GRÁFICA GASTOS POR CATEGORÍA */}

                <div className="card p-5">

                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-800">
                            {t('dashboard.gastos')} / {t('nav.categorias')}
                        </h2>

                        <p className="text-sm text-slate-500">
                            {hayFiltroPeriodo
                                ? t('dashboard.periodos.flujoPeriodoSubtitulo')
                                : t('dashboard.expenseDistribution')}
                        </p>
                    </div>

                    {periodoVacio ||
                    (hayFiltroPeriodo && listaVacia) ? (
                        <div className="flex h-72 items-center justify-center px-4 text-center text-sm text-slate-500">
                            {periodoVacio
                                ? t('dashboard.periodos.sinDatos', {
                                      periodo: etiquetaActiva,
                                  })
                                : t('dashboard.periodos.sinMovimientos', {
                                      periodo: etiquetaActiva,
                                  })}
                        </div>
                    ) : gastosPorCategoria.length ===
                    0 ? (
                        <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                            {t('dashboard.noExpensesChart')}
                        </div>
                    ) : (
                        <div className="h-72 w-full">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <PieChart>
                                    <Pie
                                        data={
                                            gastosPorCategoria
                                        }
                                        dataKey="monto"
                                        nameKey="nombre"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        label
                                    >
                                        {gastosPorCategoria.map(
                                            (
                                                entrada,
                                                index
                                            ) => (
                                                <Cell
                                                    key={
                                                        entrada.nombre
                                                    }
                                                    fill={
                                                        COLORES_CATEGORIAS[
                                                            index %
                                                                COLORES_CATEGORIAS.length
                                                        ]
                                                    }
                                                />
                                            )
                                        )}
                                    </Pie>

                                    <Tooltip
                                        formatter={(
                                            value
                                        ) =>
                                            formatearMoneda(
                                                value
                                            )
                                        }
                                    />

                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </section>

            {/* ================================
                ALERTAS DE PRESUPUESTO
            ================================= */}

            {alertas.length > 0 && (
                <section className="card mb-8 p-5">
                    <h2 className="mb-4 text-lg font-bold text-slate-800">
                        ⚠️ {t('dashboard.alertas')}
                    </h2>

                    <ul className="space-y-3">
                        {alertas.map((alerta, indice) => {
                            const esCritica =
                                alerta.tipoAlerta === 'Crítico'

                            return (
                                <li
                                    key={`alerta-${indice}`}
                                    className={`rounded-lg border-l-4 p-3 ${
                                        esCritica
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-amber-500 bg-amber-50'
                                    }`}
                                >
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <strong className={`text-xs uppercase ${
                                            esCritica
                                                ? 'text-red-700'
                                                : 'text-amber-700'
                                        }`}>
                                            {alerta.tipoAlerta === 'Crítico' ? t('dashboard.critical') : t('dashboard.warning')}
                                        </strong>

                                        <span className="text-xs font-semibold text-gray-600">
                                            {alerta.porcentajeUsado}%
                                        </span>
                                    </div>

                                    <p className="text-sm leading-5 text-gray-700">
                                        {alerta.mensaje}
                                    </p>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            )}

            {/* ================================
                METAS DE AHORRO
            ================================= */}

            <section className="card mb-8 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-slate-800">
                        🐷 {t('dashboard.metas')}
                    </h2>

                    <a
                        href="/ahorro"
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                        {t('dashboard.allGoals')}
                    </a>
                </div>

                {/* Con un período activo, las metas muestran los aportes
                    realizadas en ese período (aportesPorMeta del resumen
                    filtrado); en historial, el saldo consolidado de siempre. */}
                {periodoVacio ? (
                    <p className="py-4 text-center text-sm text-slate-500">
                        {t('dashboard.periodos.sinDatos', {
                            periodo: etiquetaActiva,
                        })}
                    </p>
                ) : hayFiltroPeriodo ? (
                    aportesPeriodo.length === 0 ? (
                        <p className="py-4 text-center text-sm text-slate-500">
                            {t('dashboard.periodos.sinAportes', {
                                periodo: etiquetaActiva,
                            })}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {aportesPeriodo.map((aporte) => {
                                const meta = metas.find(
                                    (m) => m.idMeta === aporte.idMeta
                                )
                                const objetivo = Number(
                                    meta?.montoObjetivo || 0
                                )
                                const actual = Number(meta?.montoActual || 0)
                                const porcentaje =
                                    objetivo > 0
                                        ? (actual / objetivo) * 100
                                        : 0
                                const barra = Math.min(
                                    Math.max(porcentaje, 0),
                                    100
                                )

                                return (
                                    <div
                                        key={aporte.idMeta}
                                        className="rounded-lg border border-slate-100 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate font-medium text-slate-800">
                                                {aporte.titulo}
                                            </p>

                                            <p className="whitespace-nowrap text-sm font-bold tabular-nums text-amber-700">
                                                {formatearMoneda(aporte.monto)}
                                            </p>
                                        </div>

                                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                            <div
                                                className="h-full rounded-full bg-green-500 transition-all duration-500"
                                                style={{
                                                    width: `${barra}%`,
                                                }}
                                            />
                                        </div>

                                        <p className="mt-2 text-sm text-slate-500">
                                            {formatearNumero(porcentaje, { maximumFractionDigits: 0 })}% ·{' '}
                                            {t('dashboard.goalSavedOf', {
                                                saved: formatearMoneda(actual),
                                                target: formatearMoneda(objetivo),
                                            })}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    )
                ) : metas.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-500">
                        {t('dashboard.noGoals')}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {metas.slice(0, 3).map((meta) => {
                            const objetivo =
                                Number(meta.montoObjetivo || 0)
                            const actual =
                                Number(meta.montoActual || 0)
                            const porcentaje = objetivo > 0
                                ? (actual / objetivo) * 100
                                : 0
                            const barra = Math.min(
                                Math.max(porcentaje, 0),
                                100
                            )

                            return (
                                <div
                                    key={meta.idMeta}
                                    className="rounded-lg border border-slate-100 p-4"
                                >
                                    <p className="truncate font-medium text-slate-800">
                                        {meta.titulo}
                                    </p>

                                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                        <div
                                            className="h-full rounded-full bg-green-500 transition-all duration-500"
                                            style={{
                                                width: `${barra}%`,
                                            }}
                                        />
                                    </div>

                                    <p className="mt-2 text-sm text-slate-500">
                                        {formatearNumero(porcentaje, { maximumFractionDigits: 0 })}% ·{' '}
                                        {t('dashboard.goalSavedOf', {
                                            saved: formatearMoneda(actual),
                                            target: formatearMoneda(objetivo),
                                        })}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* ================================
                MOVIMIENTOS RECIENTES
            ================================= */}

            <section className="card">

                <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {t('dashboard.movimientosRecientes')}
                        </h2>

                        <p className="text-sm text-slate-500">
                            {t('dashboard.lastTransactions')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={actualizarDashboard}
                        disabled={procesando}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {t('common.actualizar')}
                    </button>
                </div>

                {periodoVacio ||
                (hayFiltroPeriodo && listaVacia) ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                        {periodoVacio
                            ? t('dashboard.periodos.sinDatos', {
                                  periodo: etiquetaActiva,
                              })
                            : t('dashboard.periodos.sinMovimientos', {
                                  periodo: etiquetaActiva,
                              })}
                    </div>
                ) : movimientosRecientes.length ===
                0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                        {t('dashboard.noTransactions')}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">

                            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">
                                        {t('dashboard.transactionDate')}
                                    </th>

                                    <th className="px-5 py-3">
                                        {t('dashboard.transactionType')}
                                    </th>

                                    <th className="px-5 py-3">
                                        {t('dashboard.transactionDescription')}
                                    </th>

                                    <th className="px-5 py-3 text-right">
                                        {t('dashboard.transactionAmount')}
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {movimientosRecientes.map(
                                    (
                                        movimiento
                                    ) => (
                                        <tr
                                            key={
                                                movimiento.idMovimiento
                                            }
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                {movimiento.fecha ? formatearFecha(movimiento.fecha) : ''}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        movimiento.tipo ===
                                                        'Ingreso'
                                                            ? 'bg-green-100 text-green-700'
                                                            : movimiento.tipo ===
                                                              'Ahorro'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {movimiento.tipo ===
                                                    'Ingreso'
                                                        ? movimiento.origenEmisora
                                                            ? t('nav.remesas')
                                                            : t('nav.ingresos')
                                                        : movimiento.tipo ===
                                                          'Ahorro'
                                                            ? t('dashboard.ahorro')
                                                            : t('nav.gastos')}
                                                </span>
                                            </td>

                                            <td className="max-w-xs px-5 py-4 text-slate-700">
                                                {movimiento.descripcion ||
                                                    t('dashboard.noDescription')}
                                            </td>

                                            <td
                                                className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                                                    movimiento.tipo ===
                                                    'Ingreso'
                                                        ? 'text-green-600'
                                                        : movimiento.tipo ===
                                                          'Ahorro'
                                                            ? 'text-amber-600'
                                                            : 'text-red-600'
                                                }`}
                                            >
                                                {movimiento.tipo ===
                                                'Ingreso'
                                                    ? '+'
                                                    : '-'}

                                                {formatearMoneda(
                                                    movimiento.monto
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )}

                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    )
}
