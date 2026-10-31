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
import {
    AlertTriangle,
    PiggyBank,
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowLeftRight,
    BarChart3,
    PieChart as IconoPieChart,
    Inbox,
    List,
} from 'lucide-react'

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

/*
 * ==========================================
 * PIEZAS PRESENTACIONALES (sin lógica de datos)
 * ==========================================
 */

// Tintes de marca para chips de icono. Se usa bg-yellow-100 (y no amber-100)
// porque Index.css solo define el override dark para bg-yellow-100.
const TONOS = {
    verde: 'bg-green-100 text-green-700',
    ambar: 'bg-yellow-100 text-amber-700',
    rojo: 'bg-red-100 text-red-700',
    azul: 'bg-blue-100 text-blue-700',
    violeta: 'bg-violet-100 text-violet-700',
}

// Tarjeta elevada base del tablero, en el lenguaje del login (rounded-2xl +
// sombra sutil). bg-white y border-slate-100 tienen overrides dark globales.
const CLASE_TARJETA =
    'rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_3px_12px_rgba(0,0,0,0.08)]'

function ChipIcono({ Icono, tono, className = '' }) {
    return (
        <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONOS[tono]} ${className}`}
        >
            <Icono size={18} strokeWidth={2} />
        </span>
    )
}

// Encabezado de sección: chip de icono + título (h2) + subtítulo opcional +
// slot extra a la derecha (enlace, badge, botón).
function EncabezadoSeccion({ Icono, tono, titulo, subtitulo, extra }) {
    return (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                <ChipIcono
                    Icono={Icono}
                    tono={tono}
                    className="h-9 w-9 rounded-lg"
                />

                <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-slate-800 sm:text-lg">
                        {titulo}
                    </h2>

                    {subtitulo && (
                        <p className="mt-0.5 text-sm text-slate-500">
                            {subtitulo}
                        </p>
                    )}
                </div>
            </div>

            {extra}
        </div>
    )
}

// Tarjeta KPI: chip de icono en tinte de marca, etiqueta, valor grande con
// tabular-nums para escaneo instantáneo y nota de contexto opcional.
function TarjetaKpi({ Icono, tono, etiqueta, valor, colorValor, nota }) {
    return (
        <div className="flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_3px_12px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
                <ChipIcono
                    Icono={Icono}
                    tono={tono}
                    className="h-9 w-9 rounded-lg"
                />

                <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {etiqueta}
                </p>
            </div>

            <p
                className={`mt-3 truncate text-2xl font-semibold tabular-nums ${colorValor}`}
            >
                {valor}
            </p>

            {nota && (
                <p className="mt-1 truncate text-xs text-slate-500">
                    {nota}
                </p>
            )}
        </div>
    )
}

// Empty state tipográfico y centrado, reutilizando las claves i18n existentes.
function EstadoVacio({ Icono = Inbox, texto, className = '' }) {
    return (
        <div
            className={`flex flex-col items-center justify-center gap-3 px-4 text-center ${className}`}
        >
            <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"
            >
                <Icono size={22} strokeWidth={1.8} />
            </span>

            <p className="max-w-sm text-sm leading-6 text-slate-500">
                {texto}
            </p>
        </div>
    )
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

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                        {t('dashboard.titulo')}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        {t('dashboard.subtitulo')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Granularidad: Día | Semana | Mes | Año | Historial,
                        como control segmentado tipo pill. */}
                    <div
                        role="group"
                        aria-label={t('dashboard.periodos.grupo')}
                        className="flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1"
                    >
                        {/* T12: objetivo táctil ≥44px. Se decide por el
                            PUNTERO, no por el ancho: una tablet en horizontal
                            (≥640px) sigue siendo táctil y `sm` la dejaría en
                            36px. Con puntero fino (ratón) se conserva la
                            densidad compacta del grupo segmentado. */}
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
                                className={`flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold transition pointer-coarse:min-h-11 pointer-coarse:px-4 ${
                                    modoPeriodo === modo
                                        ? 'bg-[#123B8F] text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-white dark:hover:bg-slate-700'
                                }`}
                            >
                                {t(`dashboard.periodos.${modo}`)}
                            </button>
                        ))}
                    </div>

                    {/* Navegación ‹ › del período activo (inactiva en Historial) */}
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => navegarPeriodo(-1)}
                            disabled={modoPeriodo === 'historial'}
                            aria-label={t('dashboard.periodos.anterior')}
                            className="flex items-center justify-center rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent pointer-coarse:min-h-11 pointer-coarse:px-2.5"
                        >
                            ‹
                        </button>

                        <span className="min-w-[9rem] px-2 text-center text-sm font-semibold text-slate-800">
                            {etiquetaActiva}
                        </span>

                        <button
                            type="button"
                            onClick={() => navegarPeriodo(1)}
                            disabled={modoPeriodo === 'historial'}
                            aria-label={t('dashboard.periodos.siguiente')}
                            className="flex items-center justify-center rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent pointer-coarse:min-h-11 pointer-coarse:px-2.5"
                        >
                            ›
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={actualizarDashboard}
                        disabled={procesando}
                        className="btn-primary"
                    >
                        {procesando
                            ? t('common.procesando')
                            : t('common.actualizar')}
                    </button>
                </div>
            </div>

            {/* Ritmo vertical unificado del tablero */}
            <div className="space-y-6">

            {/* ================================
                TARJETAS KPI
                (si el período está vacío se muestra un empty state claro
                en lugar de montos en $0.00)
            ================================= */}

            {periodoVacio ? (
                <section className="rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_3px_12px_rgba(0,0,0,0.08)]">
                    <EstadoVacio
                        texto={t('dashboard.periodos.sinDatos', {
                            periodo: etiquetaActiva,
                        })}
                        className="py-8"
                    />
                </section>
            ) : (
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                    {/* INGRESOS */}

                    <TarjetaKpi
                        Icono={TrendingUp}
                        tono="verde"
                        etiqueta={t('dashboard.ingresos')}
                        valor={formatearMoneda(ingresos)}
                        colorValor="text-green-700"
                    />

                    {/* REMESAS */}

                    <TarjetaKpi
                        Icono={ArrowLeftRight}
                        tono="violeta"
                        etiqueta={t('dashboard.remesas')}
                        valor={formatearMoneda(remesas)}
                        colorValor="text-violet-700"
                    />

                    {/* AHORRO: el flujo del periodo, el mismo que descuenta el
                        balance. Con período activo el subtítulo muestra los
                        aportes a metas del período; en historial, el saldo
                        consolidado de las metas. */}

                    <TarjetaKpi
                        Icono={PiggyBank}
                        tono="ambar"
                        etiqueta={t('dashboard.ahorro')}
                        valor={formatearMoneda(ahorro)}
                        colorValor="text-amber-700"
                        nota={
                            hayFiltroPeriodo
                                ? `${t('dashboard.periodos.aportesPorMeta')}: ${formatearMoneda(aportesTotal)}`
                                : `${t('dashboard.ahorroSaldoMetas')}: ${formatearMoneda(ahorroTotal)}`
                        }
                    />

                    {/* GASTOS */}

                    <TarjetaKpi
                        Icono={TrendingDown}
                        tono="rojo"
                        etiqueta={t('dashboard.gastos')}
                        valor={formatearMoneda(gastos)}
                        colorValor="text-red-700"
                    />

                    {/* BALANCE */}

                    <TarjetaKpi
                        Icono={Wallet}
                        tono={balance >= 0 ? 'azul' : 'rojo'}
                        etiqueta={t('dashboard.balance')}
                        valor={formatearMoneda(balance)}
                        colorValor={
                            balance >= 0
                                ? 'text-blue-700'
                                : 'text-red-700'
                        }
                    />
                </section>
            )}

            {/* ================================
                ENLACE INGRESOS ↔ AHORRO
            ================================= */}

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Enlace del período: ingresos (y cuánto de Salario) vs ahorro
                    (y su % sobre los ingresos), con la aclaración de que el
                    ahorro ya está descontado del balance. */}

                <div className={CLASE_TARJETA}>

                    <EncabezadoSeccion
                        Icono={ArrowLeftRight}
                        tono="verde"
                        titulo={t('dashboard.periodos.enlaceTitulo')}
                        extra={
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {etiquetaActiva}
                            </span>
                        }
                    />

                    {periodoVacio ? (
                        <EstadoVacio
                            texto={t('dashboard.periodos.sinDatos', {
                                periodo: etiquetaActiva,
                            })}
                            className="py-6"
                        />
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-xl bg-green-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                                    {t('dashboard.periodos.ingresosPeriodo')}
                                </p>

                                <p className="mt-1 text-2xl font-semibold tabular-nums text-green-700">
                                    {formatearMoneda(ingresos)}
                                </p>

                                <p className="mt-1 text-sm text-green-700">
                                    {t('dashboard.periodos.deSalario')}:{' '}
                                    {formatearMoneda(ingresosSalario)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-amber-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                    {t('dashboard.periodos.ahorroPeriodo')}
                                </p>

                                <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-700">
                                    {formatearMoneda(ahorro)}
                                </p>

                                <p className="mt-1 text-sm text-amber-700">
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

                <div className={CLASE_TARJETA}>

                    <EncabezadoSeccion
                        Icono={PiggyBank}
                        tono="ambar"
                        titulo={t('dashboard.periodos.aportesPorMeta')}
                    />

                    {periodoVacio ? (
                        <EstadoVacio
                            texto={t('dashboard.periodos.sinDatos', {
                                periodo: etiquetaActiva,
                            })}
                            className="py-6"
                        />
                    ) : aportesPeriodo.length === 0 ? (
                        <EstadoVacio
                            texto={t('dashboard.periodos.sinAportes', {
                                periodo: etiquetaActiva,
                            })}
                            className="py-6"
                        />
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
                                        className="rounded-xl border border-slate-100 p-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="truncate text-sm font-medium text-slate-800">
                                                {aporte.titulo}
                                            </p>

                                            <p className="text-sm font-semibold tabular-nums text-amber-700">
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
                GRÁFICAS
            ================================= */}

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* GRÁFICA INGRESOS VS GASTOS (adaptativa por granularidad) */}

                <div className={CLASE_TARJETA}>

                    <EncabezadoSeccion
                        Icono={BarChart3}
                        tono="azul"
                        titulo={t('dashboard.flujoMensual')}
                        subtitulo={
                            hayFiltroPeriodo
                                ? t('dashboard.periodos.flujoPeriodoSubtitulo')
                                : t('dashboard.lastMonths')
                        }
                    />

                    {modoPeriodo === 'dia' ? (
                        /* Día: sin gráfica de barras; se muestra un estado
                           simple con los totales del día (la lista de
                           movimientos ya está más abajo). */
                        periodoVacio ? (
                            <EstadoVacio
                                texto={t('dashboard.periodos.sinDatos', {
                                    periodo: etiquetaActiva,
                                })}
                                className="h-72"
                            />
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
                        <EstadoVacio
                            texto={
                                periodoVacio
                                    ? t('dashboard.periodos.sinDatos', {
                                          periodo: etiquetaActiva,
                                      })
                                    : t('dashboard.periodos.sinMovimientos', {
                                          periodo: etiquetaActiva,
                                      })
                            }
                            className="h-72"
                        />
                    ) : datosGrafica.length === 0 ? (
                        <EstadoVacio
                            texto={t('dashboard.insufficientChartData')}
                            className="h-72"
                        />
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

                <div className={CLASE_TARJETA}>

                    <EncabezadoSeccion
                        Icono={IconoPieChart}
                        tono="violeta"
                        titulo={`${t('dashboard.gastos')} / ${t('nav.categorias')}`}
                        subtitulo={
                            hayFiltroPeriodo
                                ? t('dashboard.periodos.flujoPeriodoSubtitulo')
                                : t('dashboard.expenseDistribution')
                        }
                    />

                    {periodoVacio ||
                    (hayFiltroPeriodo && listaVacia) ? (
                        <EstadoVacio
                            texto={
                                periodoVacio
                                    ? t('dashboard.periodos.sinDatos', {
                                          periodo: etiquetaActiva,
                                      })
                                    : t('dashboard.periodos.sinMovimientos', {
                                          periodo: etiquetaActiva,
                                      })
                            }
                            className="h-72"
                        />
                    ) : gastosPorCategoria.length ===
                    0 ? (
                        <EstadoVacio
                            texto={t('dashboard.noExpensesChart')}
                            className="h-72"
                        />
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
                <section className={CLASE_TARJETA}>
                    <EncabezadoSeccion
                        Icono={AlertTriangle}
                        tono="ambar"
                        titulo={t('dashboard.alertas')}
                    />

                    <ul className="space-y-3">
                        {alertas.map((alerta, indice) => {
                            const esCritica =
                                alerta.tipoAlerta === 'Crítico'

                            return (
                                <li
                                    key={`alerta-${indice}`}
                                    className={`flex items-start gap-3 rounded-xl border-l-4 p-4 ${
                                        esCritica
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-amber-500 bg-amber-50'
                                    }`}
                                >
                                    <AlertTriangle
                                        size={18}
                                        aria-hidden="true"
                                        className={`mt-0.5 shrink-0 ${
                                            esCritica
                                                ? 'text-red-600'
                                                : 'text-amber-600'
                                        }`}
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <strong className={`text-xs font-semibold uppercase tracking-wide ${
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
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            )}

            {/* ================================
                METAS DE AHORRO
            ================================= */}

            <section className={CLASE_TARJETA}>
                <EncabezadoSeccion
                    Icono={PiggyBank}
                    tono="ambar"
                    titulo={t('dashboard.metas')}
                    extra={
                        <a
                            href="/ahorro"
                            className="text-sm font-semibold text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            {t('dashboard.allGoals')}
                        </a>
                    }
                />

                {/* Con un período activo, las metas muestran los aportes
                    realizadas en ese período (aportesPorMeta del resumen
                    filtrado); en historial, el saldo consolidado de siempre. */}
                {periodoVacio ? (
                    <EstadoVacio
                        texto={t('dashboard.periodos.sinDatos', {
                            periodo: etiquetaActiva,
                        })}
                        className="py-6"
                    />
                ) : hayFiltroPeriodo ? (
                    aportesPeriodo.length === 0 ? (
                        <EstadoVacio
                            texto={t('dashboard.periodos.sinAportes', {
                                periodo: etiquetaActiva,
                            })}
                            className="py-6"
                        />
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
                                        className="rounded-xl border border-slate-100 p-4"
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
                    <EstadoVacio
                        texto={t('dashboard.noGoals')}
                        className="py-6"
                    />
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
                                    className="rounded-xl border border-slate-100 p-4"
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

            <section className={CLASE_TARJETA}>

                <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">
                        <ChipIcono
                            Icono={List}
                            tono="azul"
                            className="h-9 w-9 rounded-lg"
                        />

                        <div>
                            <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                                {t('dashboard.movimientosRecientes')}
                            </h2>

                            <p className="mt-0.5 text-sm text-slate-500">
                                {t('dashboard.lastTransactions')}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={actualizarDashboard}
                        disabled={procesando}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-700"
                    >
                        {t('common.actualizar')}
                    </button>
                </div>

                {periodoVacio ||
                (hayFiltroPeriodo && listaVacia) ? (
                    <EstadoVacio
                        texto={
                            periodoVacio
                                ? t('dashboard.periodos.sinDatos', {
                                      periodo: etiquetaActiva,
                                  })
                                : t('dashboard.periodos.sinMovimientos', {
                                      periodo: etiquetaActiva,
                                  })
                        }
                        className="py-8"
                    />
                ) : movimientosRecientes.length ===
                0 ? (
                    <EstadoVacio
                        texto={t('dashboard.noTransactions')}
                        className="py-8"
                    />
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

            </div>
        </main>
    )
}
