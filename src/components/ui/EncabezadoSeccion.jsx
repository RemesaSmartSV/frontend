import { ChipIcono } from './ChipIcono'

// Encabezado de sección: chip de icono + título (h2) + subtítulo opcional +
// slot extra a la derecha (enlace, badge, botón).
export function EncabezadoSeccion({ Icono, tono, titulo, subtitulo, extra }) {
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
