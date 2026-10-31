import { ChipIcono } from './ChipIcono'

// Tarjeta KPI: chip de icono en tinte de marca, etiqueta, valor grande con
// tabular-nums para escaneo instantáneo y nota de contexto opcional.
export function TarjetaKpi({ Icono, tono, etiqueta, valor, colorValor, nota }) {
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
