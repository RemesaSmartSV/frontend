import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Dashboard from './Dashboard'

// Mock de useTranslation: devuelve las claves como texto (suficiente para tests).
//
// IMPORTANTE: `t` e `i18n` deben ser referencias ESTABLES creadas una sola vez.
// El componente `Dashboard` usa `t` como dependencia de `useCallback` (cargarDatos)
// y de `useEffect`; si el mock devolviera una función `t` nueva en cada render,
// el effect se re-dispararía en bucle infinito y el dashboard nunca terminaría
// de cargar. Por eso se definen fuera del retorno y se reutilizan.
vi.mock('react-i18next', () => {
    const map = {
        'dashboard.titulo': 'Resumen financiero',
        'dashboard.subtitulo': 'Consulta el estado actual de las finanzas de tu hogar.',
        'dashboard.ingresos': 'Ingresos',
        'dashboard.gastos': 'Gastos',
        'dashboard.ahorro': 'Ahorro',
        'dashboard.balance': 'Balance',
        'dashboard.remesas': 'Remesas',
        'dashboard.alertas': 'Alertas de presupuesto',
        'dashboard.metas': 'Metas de ahorro',
        'dashboard.movimientosRecientes': 'Movimientos recientes',
        'dashboard.todoHistorial': 'Todo el historial',
        'dashboard.periodos.dia': 'Día',
        'dashboard.periodos.semana': 'Semana',
        'dashboard.periodos.mes': 'Mes',
        'dashboard.periodos.anio': 'Año',
        'dashboard.periodos.historial': 'Historial',
        'nav.categorias': 'Categorías',
    }

    const t = (key) => map[key] || key

    // `language` también debe estar: Dashboard lo usa para los gráficos.
    const i18n = { language: 'es', changeLanguage: () => {} }

    return {
        useTranslation: () => ({ t, i18n }),
    }
})

// Mock de global.fetch que responde con las formas REALES que devuelve el
// backend en producción, y que registra cada URL solicitada.
let fetchMock
let llamadas
const fetchOriginal = global.fetch

function construirRespuesta(cuerpo) {
    return new Response(JSON.stringify(cuerpo), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
}

beforeEach(() => {
    llamadas = []

    fetchMock = vi.fn(async (url) => {
        const destino = String(url)
        llamadas.push(destino)

        if (destino.includes('/Alertas/')) {
            return construirRespuesta([])
        }

        if (destino.includes('/resumen')) {
            return construirRespuesta({
                totalIngresos: 0,
                totalGastos: 0,
                balance: 0,
            })
        }

        if (
            destino.includes('/Movimientos') ||
            destino.includes('/Categorias') ||
            destino.includes('/Presupuestos')
        ) {
            return construirRespuesta({
                items: [],
                total: 0,
                page: 1,
                pageSize: 100,
                totalPages: 0,
            })
        }

        if (destino.includes('/Hogares')) {
            return construirRespuesta({
                idHogar: 1,
                nombreFamiliar: 'Hogar Repro',
                fechaCreacion:
                    '2026-09-30T17:13:31.2790560Z',
            })
        }

        return construirRespuesta([])
    })

    global.fetch = fetchMock

    // Defensa: algunas librerías de graficado pueden pedir scroll.
    window.scrollTo = vi.fn()
})

afterEach(() => {
    global.fetch = fetchOriginal
})

describe('Dashboard', () => {
    // Regression test del ReferenceError "categorias is not defined":
    // el identificador se usaba en el cuerpo y en el arreglo de dependencias
    // de obtenerNombreCategoria sin estar declarado, lo que dejaba la app
    // en pantalla en blanco.
    it('renderiza sin lanzar ReferenceError y pide las categorias al backend', async () => {
        render(<Dashboard />)

        // Render sin excepciones: el dashboard termina de cargar y muestra
        // su encabezado principal.
        expect(
            await screen.findByRole('heading', {
                name: /Resumen financiero/i,
            })
        ).toBeInTheDocument()

        // Prueba de que el estado quedó cableado a un fetch real.
        expect(
            llamadas.some((url) => url.includes('/Categorias'))
        ).toBe(true)
    })

    it('muestra la tarjeta de Ahorro consolidado', async () => {
        render(<Dashboard />)

        expect(
            await screen.findByText('Ahorro')
        ).toBeInTheDocument()
    })

    it('el selector de período pide el resumen filtrado por mes', async () => {
        render(<Dashboard />)

        await screen.findByRole('heading', {
            name: /Resumen financiero/i,
        })

        // Clic en el modo "Mes": el resumen usa el filtro histórico anio+mes.
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Mes',
            })
        )

        // La última llamada a /resumen debe llevar anio y mes.
        const llamadasResumen = llamadas.filter((url) =>
            url.includes('/resumen')
        )

        expect(
            llamadasResumen[llamadasResumen.length - 1]
        ).toMatch(/resumen\?anio=\d{4}&mes=\d{1,2}/)
    })
})
