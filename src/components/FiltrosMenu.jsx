import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Filter } from 'lucide-react'

/*
 * FiltrosMenu — botón "Filtros" con badge y panel flotante (popover).
 *
 * API (T1 del feature "filtros-menu-desplegable"):
 *
 * - `children`: los controles del panel. SIEMPRE están montados en el DOM;
 *   el componente sólo alterna la clase `hidden` del contenedor del panel.
 *   Así los `id`/`name`/`label htmlFor` de cada control siguen resolviéndose
 *   con el panel cerrado (contrato R2: `document.getElementById` sigue
 *   funcionando y jsdom ignora el CSS).
 * - `cantidadActivos`: cantidad de filtros con valor (>0 muestra badge).
 *   El componente no calcula nada: el padre conoce su propio estado, así
 *   queda puro, testeable y reutilizable en cualquier página.
 * - `onLimpiar` (opcional): si se pasa, pinta el botón "Limpiar filtros"
 *   dentro del panel; si no, el padre puede incluir su propio cierre en
 *   `children`.
 *
 * El estado de apertura es INTERNO: ninguna página necesita leerlo ni
 * controlarlo, así que no se expone como prop (API mínima).
 *
 * Cierre: click-outside (`mousedown`, mismo criterio que Navbar) y `Escape`.
 * Con `Escape` el foco vuelve al botón. Con click-outside NO se devuelve el
 * foco a propósito: el usuario está haciendo click en otro control y
 * robarle el foco ahí (en el `mousedown`) haría que ni siquiera llegue a
 * escribir en ese campo.
 */
export default function FiltrosMenu({
    children,
    cantidadActivos = 0,
    onLimpiar,
}) {
    const { t } = useTranslation()
    const [abierto, setAbierto] = useState(false)
    const contenedorRef = useRef(null)
    const botonRef = useRef(null)

    // useId devuelve `:r0:`; los dos puntos no sirven en selectores CSS,
    // así que se limpian para dejar ids usables con querySelector('#...').
    const uid = useId().replace(/:/g, '')
    const idBoton = `filtros-boton-${uid}`
    const idPanel = `filtros-panel-${uid}`

    // CIERRE POR CLICK FUERA
    useEffect(() => {
        if (!abierto) {
            return undefined
        }

        function cerrarSiClickeaFuera(evento) {
            if (
                contenedorRef.current &&
                !contenedorRef.current.contains(evento.target)
            ) {
                setAbierto(false)
            }
        }

        document.addEventListener('mousedown', cerrarSiClickeaFuera)

        return () => {
            document.removeEventListener('mousedown', cerrarSiClickeaFuera)
        }
    }, [abierto])

    // CIERRE CON ESCAPE + devolución de foco al botón
    useEffect(() => {
        if (!abierto) {
            return undefined
        }

        function cerrarConEscape(evento) {
            if (evento.key !== 'Escape') {
                return
            }

            setAbierto(false)
            botonRef.current?.focus()
        }

        document.addEventListener('keydown', cerrarConEscape)

        return () => {
            document.removeEventListener('keydown', cerrarConEscape)
        }
    }, [abierto])

    return (
        <div className="relative" ref={contenedorRef}>

            {/* BOTÓN */}

            <button
                id={idBoton}
                ref={botonRef}
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-gray-50 sm:w-auto dark:border-gray-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label={
                    cantidadActivos > 0
                        ? t('filtros.conContador', {
                            count: cantidadActivos,
                        })
                        : t('filtros.titulo')
                }
                aria-expanded={abierto}
                aria-controls={idPanel}
                onClick={() => setAbierto((valor) => !valor)}
            >
                <Filter size={17} aria-hidden="true" />
                <span>{t('filtros.titulo')}</span>

                {/* El número es decorativo para lectores de pantalla: la
                    cantidad ya viaja en el aria-label del botón. */}
                {cantidadActivos > 0 && (
                    <span
                        aria-hidden="true"
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white dark:bg-blue-500"
                    >
                        {cantidadActivos}
                    </span>
                )}
            </button>

            {/* PANEL FLOTANTE
                Anclado bajo el botón (`top-full`). En mobile se alinea a la
                derecha para no desbordar el viewport (el contenedor ocupa todo
                el ancho); desde `sm` el contenedor ya sólo mide lo que el
                botón, así que se alinea a la IZQUIERDA del botón: hacia la
                derecha quedan los botones de exportar/actualizar y un panel
                anclado a la derecha se metería debajo del sidebar. */}

            <div
                id={idPanel}
                role="group"
                aria-labelledby={idBoton}
                className={`card absolute right-0 top-full z-30 mt-2 max-h-[70vh] w-[20rem] max-w-[calc(100vw-2rem)] overflow-y-auto p-4 sm:left-0 sm:right-auto sm:w-[32rem] sm:p-5 ${abierto ? '' : 'hidden'}`}
            >
                {children}

                {onLimpiar && (
                    <div className="mt-4 flex justify-end border-t border-gray-200 pt-3 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onLimpiar}
                            className="rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-600"
                        >
                            {t('common.limpiarFiltros')}
                        </button>
                    </div>
                )}
            </div>

        </div>
    )
}
