import {
    Home,
    ClipboardList,
    Tags,
    Banknote,
    TrendingUp,
    TrendingDown,
    Wallet,
} from 'lucide-react'

import { formatearMoneda } from '../utils/formato'

/**
 * Réplica estática de la pantalla "Resumen financiero" del dashboard real.
 *
 * Existe solo para la presentación comercial: reproduce la estructura real
 * (tarjetas de resumen, gráfica de barras, gráfica circular y menú lateral)
 * sin llamar al API. Los montos son de ejemplo y la tarjeta se rotula como
 * vista ilustrativa para no presentar cifras como datos reales.
 */

const OPCIONES_MENU = [
    Home,
    ClipboardList,
    Tags,
    Banknote,
    TrendingUp,
    TrendingDown,
    Wallet,
]

const TARJETAS = [
    { etiqueta: 'Ingresos', monto: 1850, tono: 'verde' },
    { etiqueta: 'Remesas', monto: 800, tono: 'violeta' },
    { etiqueta: 'Gastos', monto: 610, tono: 'rojo' },
    { etiqueta: 'Balance', monto: 1240, tono: 'azul' },
]

const TONOS = {
    verde: 'border-green-100 bg-green-50 text-green-700',
    violeta: 'border-violet-100 bg-violet-50 text-violet-700',
    rojo: 'border-red-100 bg-red-50 text-red-700',
    azul: 'border-blue-100 bg-blue-50 text-blue-700',
}

// Alturas relativas (no son montos): solo dan forma a la gráfica ilustrativa.
const SERIE_MENSUAL = [
    { mes: 'Jun', ingresos: 58, gastos: 41 },
    { mes: 'Jul', ingresos: 76, gastos: 53 },
    { mes: 'Ago', ingresos: 52, gastos: 64 },
    { mes: 'Sep', ingresos: 88, gastos: 46 },
]

const REPARTO_CATEGORIAS = [
    { color: '#7c3aed', porcentaje: 38 },
    { color: '#2563eb', porcentaje: 27 },
    { color: '#16a34a', porcentaje: 20 },
    { color: '#dc2626', porcentaje: 15 },
]

function GraficaBarras() {
    return (
        <div className="flex h-28 items-end justify-between gap-2 sm:gap-4">
            {SERIE_MENSUAL.map((dato) => (
                <div
                    key={dato.mes}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                    <div className="flex h-full w-full items-end justify-center gap-1">
                        <div
                            className="w-2.5 rounded-t bg-[#16a34a] sm:w-3"
                            style={{ height: `${dato.ingresos}%` }}
                        />
                        <div
                            className="w-2.5 rounded-t bg-[#dc2626] sm:w-3"
                            style={{ height: `${dato.gastos}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">
                        {dato.mes}
                    </span>
                </div>
            ))}
        </div>
    )
}

function GraficaCircular() {
    const paradas = REPARTO_CATEGORIAS.reduce(
        (acumulado, categoria, indice) => {
            const inicio = indice === 0 ? 0 : acumulado.anterior
            const fin = inicio + categoria.porcentaje
            acumulado.anterior = fin
            acumulado.definiciones.push(
                `${categoria.color} ${inicio}% ${fin}%`
            )
            return acumulado
        },
        { anterior: 0, definiciones: [] }
    )

    return (
        <div className="flex h-28 items-center justify-center gap-5">
            <div
                className="h-24 w-24 shrink-0 rounded-full sm:h-28 sm:w-28"
                style={{
                    background: `conic-gradient(${paradas.definiciones.join(', ')})`,
                }}
            />

            <ul className="flex flex-col gap-2">
                {REPARTO_CATEGORIAS.map((categoria) => (
                    <li
                        key={categoria.color}
                        className="flex items-center gap-2"
                    >
                        <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: categoria.color }}
                        />
                        <span className="text-[11px] text-slate-500">
                            {categoria.porcentaje}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default function DashboardPreview() {
    return (
        <div
            role="img"
            aria-label="Vista ilustrativa del dashboard de RemesaSmart SV: tarjetas de ingresos, remesas, gastos y balance, gráfica de ingresos contra gastos y gráfica de gastos por categoría."
            className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]"
        >
            <div aria-hidden="true">
                {/* BARRA DEL NAVEGADOR */}
                <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

                    <span className="ml-2 hidden rounded-md bg-white px-3 py-1 text-[11px] font-medium text-slate-500 sm:inline">
                        app.remesasmart.app
                    </span>
                </div>

                <div className="flex">
                    {/* MENÚ LATERAL */}
                    <div className="hidden w-14 shrink-0 flex-col items-center gap-1.5 bg-[#123B8F] py-4 sm:flex">
                        {OPCIONES_MENU.map((Icono, indice) => (
                            <span
                                key={indice}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                    indice === 0
                                        ? 'bg-[#0B2E6B] text-white'
                                        : 'text-white/60'
                                }`}
                            >
                                <Icono size={16} strokeWidth={1.8} />
                            </span>
                        ))}
                    </div>

                    {/* CONTENIDO */}
                    <div className="min-w-0 flex-1 bg-slate-50 p-4 sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-bold text-slate-800">
                                    Resumen financiero
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    Estado actual de las finanzas del hogar.
                                </p>
                            </div>

                            <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white">
                                Actualizar
                            </span>
                        </div>

                        {/* TARJETAS DE RESUMEN */}
                        <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                            {TARJETAS.map((tarjeta) => (
                                <div
                                    key={tarjeta.etiqueta}
                                    className={`rounded-xl border p-3 shadow-sm ${TONOS[tarjeta.tono]}`}
                                >
                                    <p className="text-[11px] font-medium">
                                        {tarjeta.etiqueta}
                                    </p>
                                    <p className="mt-1 text-base font-bold">
                                        {formatearMoneda(tarjeta.monto)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* GRÁFICAS */}
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                                <p className="mb-3 text-xs font-bold text-slate-800">
                                    Ingresos vs. gastos
                                </p>
                                <GraficaBarras />

                                <div className="mt-3 flex items-center gap-4">
                                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                        <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
                                        Ingresos
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                        <span className="h-2 w-2 rounded-full bg-[#dc2626]" />
                                        Gastos
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                                <p className="mb-3 text-xs font-bold text-slate-800">
                                    Gastos por categoría
                                </p>
                                <GraficaCircular />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
