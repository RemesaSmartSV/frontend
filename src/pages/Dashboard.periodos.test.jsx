import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Dashboard from './Dashboard'
import { formatearMoneda } from '../utils/formato'

// Mock de useTranslation: `t` e `i18n` deben ser referencias ESTABLES creadas
// una sola vez (patrón post-T14). Dashboard usa `t` como dependencia de
// useCallback (cargarDatos) y de useEffect; si el mock devolviera una función
// `t` nueva en cada render, el effect se re-dispararía en bucle infinito y el
// dashboard nunca terminaría de cargar.
//
// Además `t` interpola {{clave}} para poder assertear los empty states y el
// % con el período/valor reales, como hace i18next en producción.
vi.mock('react-i18next', () => {
    const map = {
        'dashboard.titulo': 'Resumen financiero',
        'dashboard.subtitulo': 'Consulta el estado actual de las finanzas de tu hogar.',
        'dashboard.ingresos': 'Ingresos',
        'dashboard.gastos': 'Gastos',
        'dashboard.ahorro': 'Ahorro',
        'dashboard.ahorroSaldoMetas': 'Saldo en metas',
        'dashboard.balance': 'Balance',
        'dashboard.remesas': 'Remesas',
        'dashboard.alertas': 'Alertas de presupuesto',
        'dashboard.metas': 'Metas de ahorro',
        'dashboard.movimientosRecientes': 'Movimientos recientes',
        'dashboard.todoHistorial': 'Todo el historial',
        'dashboard.flujoMensual': 'Ingresos, ahorro y gastos',
        'dashboard.lastMonths': 'Últimos meses',
        'dashboard.noCategory': 'Sin categoría',
        'dashboard.noDescription': 'Sin descripción',
        'dashboard.updated': 'Actualizado',
        'dashboard.loadError': 'Error al cargar',
        'dashboard.loading': 'Cargando',
        'dashboard.insufficientChartData': 'Sin datos para la gráfica',
        'dashboard.noExpensesChart': 'Sin gastos',
        'dashboard.expenseDistribution': 'Distribución',
        'dashboard.allGoals': 'Ver todas',
        'dashboard.noGoals': 'Sin metas',
        'dashboard.lastTransactions': 'Últimos movimientos',
        'dashboard.noTransactions': 'Sin movimientos',
        'dashboard.transactionDate': 'Fecha',
        'dashboard.transactionType': 'Tipo',
        'dashboard.transactionDescription': 'Descripción',
        'dashboard.transactionAmount': 'Monto',
        'dashboard.critical': 'Crítico',
        'dashboard.warning': 'Advertencia',
        'dashboard.periodos.grupo': 'Selector de período',
        'dashboard.periodos.dia': 'Día',
        'dashboard.periodos.semana': 'Semana',
        'dashboard.periodos.mes': 'Mes',
        'dashboard.periodos.anio': 'Año',
        'dashboard.periodos.historial': 'Historial',
        'dashboard.periodos.anterior': 'Período anterior',
        'dashboard.periodos.siguiente': 'Período siguiente',
        'dashboard.periodos.sinDatos': 'No hay nada registrado en {{periodo}}.',
        'dashboard.periodos.sinMovimientos': 'No hay movimientos registrados en {{periodo}}.',
        'dashboard.periodos.sinAportes': 'No hay aportes a metas en {{periodo}}.',
        'dashboard.periodos.enlaceTitulo': 'Ingresos y ahorro del período',
        'dashboard.periodos.ingresosPeriodo': 'Ingresos del período',
        'dashboard.periodos.deSalario': 'De Salario',
        'dashboard.periodos.ahorroPeriodo': 'Ahorro del período',
        'dashboard.periodos.porcentajeIngresos': '{{porcentaje}}% de los ingresos',
        'dashboard.periodos.sinIngresos': 'Sin ingresos registrados en el período.',
        'dashboard.periodos.ahorroYaDescontado': 'El ahorro ya está descontado en el balance del período.',
        'dashboard.periodos.aportesPorMeta': 'Aportes a metas del período',
        'dashboard.periodos.diaTotales': 'Totales del día',
        'dashboard.periodos.flujoPeriodoSubtitulo': 'Comportamiento del período seleccionado.',
        'nav.categorias': 'Categorías',
        'nav.ingresos': 'Ingresos',
        'nav.gastos': 'Gastos',
        'nav.remesas': 'Remesas',
        'common.actualizar': 'Actualizar',
        'common.procesando': 'Procesando',
    }

    const t = (clave, opciones = {}) => {
        const texto = map[clave] || clave

        return texto.replace(/\{\{(\w+)\}\}/g, (coincidencia, nombre) =>
            opciones[nombre] !== undefined
                ? String(opciones[nombre])
                : coincidencia
        )
    }

    // `language` también debe estar: Dashboard lo usa para los gráficos.
    const i18n = { language: 'es', changeLanguage: () => {} }

    return {
        useTranslation: () => ({ t, i18n }),
    }
})

// Mock de global.fetch: registra cada URL y responde con formas reales del
// backend. `resumenServidor` es sobreescribible por test (antes del render).
let fetchMock
let llamadas
let resumenServidor
const fetchOriginal = global.fetch

function construirRespuesta(cuerpo) {
    return new Response(JSON.stringify(cuerpo), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
}

function paginar(items) {
    return {
        items,
        total: items.length,
        page: 1,
        pageSize: 100,
        totalPages: 1,
    }
}

beforeEach(() => {
    llamadas = []

    resumenServidor = {
        totalIngresos: 0,
        totalGastos: 0,
        totalAhorro: 0,
        balance: 0,
        tieneDatos: true,
        ingresosSalario: 0,
        aportesPorMeta: [],
    }

    fetchMock = vi.fn(async (url) => {
        const destino = String(url)
        llamadas.push(destino)

        if (destino.includes('/Alertas/')) {
            return construirRespuesta([])
        }

        if (destino.includes('/resumen')) {
            return construirRespuesta(resumenServidor)
        }

        if (
            destino.includes('/Movimientos') ||
            destino.includes('/Categorias') ||
            destino.includes('/MetasAhorro') ||
            destino.includes('/Presupuestos')
        ) {
            return construirRespuesta(paginar([]))
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

function ultimaLlamada(filtro) {
    const coincidencias = llamadas.filter((url) => url.includes(filtro))

    return coincidencias[coincidencias.length - 1]
}

describe('Dashboard - visualización por períodos', () => {
    it('cambiar a modo "Día" pide resumen y lista con fechaInicio/fechaFin (ISO UTC)', async () => {
        render(<Dashboard />)

        await screen.findByRole('heading', {
            name: /Resumen financiero/i,
        })

        fireEvent.click(
            screen.getByRole('button', { name: 'Día' })
        )

        // El resumen del día viaja con el rango ISO UTC (sin anio/mes: la
        // prelación del backend daría prioridad al rango de todos modos).
        await waitFor(() => {
            const resumen = ultimaLlamada('/resumen')

            expect(resumen).toContain('fechaInicio=')
            expect(resumen).toContain('fechaFin=')
            expect(resumen).not.toContain('anio=')
        })

        // La lista de movimientos también se filtra por el rango del día.
        const lista = ultimaLlamada('/Movimientos?')

        expect(lista).toContain('fechaInicio=')
        expect(lista).toContain('fechaFin=')
    })

    it('con tieneDatos: false muestra el mensaje de período vacío y no montos en $0.00', async () => {
        resumenServidor = {
            totalIngresos: 0,
            totalGastos: 0,
            totalAhorro: 0,
            balance: 0,
            tieneDatos: false,
            ingresosSalario: 0,
            aportesPorMeta: [],
        }

        render(<Dashboard />)

        await screen.findByRole('heading', {
            name: /Resumen financiero/i,
        })

        fireEvent.click(
            screen.getByRole('button', { name: 'Día' })
        )

        // El empty state del período aparece en varias secciones (KPIs,
        // gráfica, pie, lista y metas), con el nombre del período interpolado.
        expect(
            await screen.findAllByText(/No hay nada registrado en/)
        ).not.toHaveLength(0)

        // No se muestran montos vacíos sin contexto en su lugar.
        expect(screen.queryByText('$0.00')).toBeNull()
    })

    it('la tarjeta de enlace ingresos↔ahorro muestra el % de ahorro sobre los ingresos', async () => {
        resumenServidor = {
            totalIngresos: 200,
            totalGastos: 50,
            totalAhorro: 50,
            balance: 100,
            tieneDatos: true,
            ingresosSalario: 120,
            aportesPorMeta: [],
        }

        render(<Dashboard />)

        // 50 de ahorro sobre 200 de ingresos = 25%.
        expect(
            await screen.findByText('25% de los ingresos')
        ).toBeInTheDocument()

        // El desglose de ingresos deja ver cuánto fue de la categoría Salario.
        expect(
            screen.getByText(/De Salario/)
        ).toHaveTextContent(`De Salario: ${formatearMoneda(120)}`)

        // Y aclara que el ahorro ya está descontado del balance.
        expect(
            screen.getByText(/descuento|descontado/i)
        ).toBeInTheDocument()
    })

    it('renderiza aportesPorMeta con el título de cada meta y su monto', async () => {
        resumenServidor = {
            totalIngresos: 500,
            totalGastos: 100,
            totalAhorro: 75,
            balance: 325,
            tieneDatos: true,
            ingresosSalario: 400,
            aportesPorMeta: [
                { idMeta: 1, titulo: 'Viaje familiar', monto: 75 },
            ],
        }

        render(<Dashboard />)

        expect(
            await screen.findByText('Viaje familiar')
        ).toBeInTheDocument()

        // El monto del aporte vive en el ítem de esa meta (el mismo valor
        // puede aparecer también en el KPI de ahorro y en la tarjeta).
        const itemAporte = screen
            .getByText('Viaje familiar')
            .closest('li')

        expect(itemAporte).toHaveTextContent(formatearMoneda(75))
    })
})
