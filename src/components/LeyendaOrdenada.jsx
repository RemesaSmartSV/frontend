// Recharts ordena la leyenda ALFABETICAMENTE por el name de cada serie,
// no por el orden en que aparecen los <Bar>. Por eso en español salía
// Ahorro, Gastos, Ingresos. Este componente toma el control del render
// y devuelve siempre el orden de negocio: ingreso, ahorro, gasto.
//
// El orden se fija por dataKey y no por name, así no se rompe al
// cambiar de idioma.
const ORDEN_SERIES = {
    ingresos: 0,
    ahorro: 1,
    gastos: 2,
}

export default function LeyendaOrdenada({ payload }) {
    if (!payload?.length) {
        return null
    }

    const items = [...payload].sort(
        (a, b) =>
            (ORDEN_SERIES[a.dataKey] ?? 99) -
            (ORDEN_SERIES[b.dataKey] ?? 99)
    )

    return (
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-3 text-xs text-slate-600">
            {items.map((item) => (
                <li
                    key={item.dataKey ?? item.value}
                    className="flex items-center gap-1.5"
                >
                    <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: item.color }}
                    />

                    {item.value}
                </li>
            ))}
        </ul>
    )
}
