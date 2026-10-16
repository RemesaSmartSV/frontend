import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Dashboard from './Dashboard'
import { formatearMoneda } from '../utils/formato'

// `t` debe ser una referencia ESTABLE entre renders: si cambia en cada render,
// el useCallback de cargarDatos se recrea, useEffect se re-dispara en bucle y el
// dashboard nunca sale del estado de carga.
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
        'dashboard.flujoMensual': 'Ingresos, ahorro y gastos',
        'dashboard.lastMonths': 'Últimos meses',
        'dashboard.alertas': 'Alertas de presupuesto',
        'dashboard.metas': 'Metas de ahorro',
        'dashboard.movimientosRecientes': 'Movimientos recientes',
        'dashboard.todoHistorial': 'Todo el historial',
        'dashboard.noCategory': 'Sin categoría',
        'dashboard.noDescription': 'Sin descripción',
        'dashboard.updated': 'Actualizado',
        'dashboard.loadError': 'Error al cargar',
        'dashboard.loading': 'Cargando',
        'dashboard.insufficientChartData': 'Sin datos',
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
        'dashboard.mesAnterior': 'Mes anterior',
        'dashboard.mesSiguiente': 'Mes siguiente',
        'nav.categorias': 'Categorías',
        'nav.ingresos': 'Ingresos',
        'nav.gastos': 'Gastos',
        'nav.remesas': 'Remesas',
        'common.actualizar': 'Actualizar',
        'common.procesando': 'Procesando',
    }

    const t = (key) => map[key] || key

    return {
        useTranslation: () => ({
            t,
            i18n: { language: 'es', changeLanguage: () => {} },
        }),
    }
})

// jsdom no tiene tamaño de pantalla: ResponsiveContainer mide 0 y recharts no
// dibuja las barras. El mock deja a la vista el orden y el color de cada Bar.
vi.mock('recharts', async () => {
    const React = await import('react')

    const noop = () => null

    return {
        ResponsiveContainer: ({ children }) =>
            React.createElement('div', { 'data-testid': 'contenedor-grafica' }, children),
        BarChart: ({ data, children }) =>
            React.createElement(
                'div',
                { 'data-testid': 'bar-chart', 'data-meses': JSON.stringify(data || []) },
                children
            ),
        Bar: ({ dataKey, name, fill }) =>
            React.createElement('div', {
                'data-testid': `bar-${dataKey}`,
                'data-name': name,
                'data-fill': fill,
            }),
        CartesianGrid: noop,
        XAxis: noop,
        YAxis: noop,
        Tooltip: noop,
        Legend: noop,
        PieChart: ({ children }) => React.createElement('div', null, children),
        Pie: noop,
        Cell: noop,
    }
})

const RESUMEN = {
    totalIngresos: 1000,
    totalGastos: 400,
    totalAhorro: 150,
    balance: 450,
}

const MOVIMIENTOS = [
    {
        idMovimiento: 1,
        idCategoria: 1,
        idUsuario: 1,
        monto: 1000,
        fecha: '2026-10-03T12:00:00Z',
        tipo: 'Ingreso',
        descripcion: 'Salario',
    },
    {
        idMovimiento: 2,
        idCategoria: 2,
        idUsuario: 1,
        monto: 400,
        fecha: '2026-10-04T12:00:00Z',
        tipo: 'Gasto',
        descripcion: 'Mercado',
    },
    {
        idMovimiento: 3,
        idCategoria: 3,
        idUsuario: 1,
        monto: 150,
        fecha: '2026-10-05T12:00:00Z',
        tipo: 'Ahorro',
        descripcion: 'Aporte a la meta Viaje',
        origenEmisora: 'aporte:1',
    },
]

const CATEGORIAS = [
    { idCategoria: 1, idHogar: 1, nombre: 'Salario', tipo: 'Ingreso', icono: 'x' },
    { idCategoria: 2, idHogar: 1, nombre: 'Mercado', tipo: 'Gasto', icono: 'x' },
    { idCategoria: 3, idHogar: 1, nombre: 'Otros ahorros', tipo: 'Ahorro', icono: 'x' },
]

const METAS = [
    { idMeta: 1, titulo: 'Viaje', montoObjetivo: 500, montoActual: 320 },
]

let fetchOriginal

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
    fetchOriginal = global.fetch

    global.fetch = vi.fn(async (url) => {
        const destino = String(url)

        if (destino.includes('/Alertas/')) {
            return construirRespuesta([])
        }

        if (destino.includes('/resumen')) {
            return construirRespuesta(RESUMEN)
        }

        if (destino.includes('/MetasAhorro')) {
            return construirRespuesta(paginar(METAS))
        }

        if (destino.includes('/Movimientos')) {
            return construirRespuesta(paginar(MOVIMIENTOS))
        }

        if (destino.includes('/Categorias')) {
            return construirRespuesta(paginar(CATEGORIAS))
        }

        if (destino.includes('/Presupuestos')) {
            return construirRespuesta(paginar([]))
        }

        if (destino.includes('/Hogares')) {
            return construirRespuesta({
                idHogar: 1,
                nombreFamiliar: 'Hogar Repro',
                fechaCreacion: '2026-09-30T17:13:31.2790560Z',
            })
        }

        return construirRespuesta([])
    })

    window.scrollTo = vi.fn()
})

afterEach(() => {
    global.fetch = fetchOriginal
})

describe('Dashboard - ahorro en el tablero', () => {
    it('muestra el KPI de ahorro con el total del periodo que devuelve el backend', async () => {
        render(<Dashboard />)

        // "Ahorro" aparece también en la leyenda de la gráfica y en la lista de
        // movimientos recientes, por eso se buscan todas las coincidencias.
        expect((await screen.findAllByText('Ahorro')).length).toBeGreaterThan(0)

        // El monto principal de la tarjeta de ahorro es el flujo del periodo.
        expect(
            await screen.findByText(formatearMoneda(RESUMEN.totalAhorro))
        ).toBeInTheDocument()
    })

    it('muestra el saldo consolidado de las metas como dato complementario del ahorro', async () => {
        render(<Dashboard />)

        expect(
            await screen.findByText(/Saldo en metas/)
        ).toHaveTextContent(formatearMoneda(METAS[0].montoActual))
    })

    it('dibuja la barra de ahorro en naranja, entre ingresos y gastos', async () => {
        render(<Dashboard />)

        const barraIngresos = await screen.findByTestId('bar-ingresos')
        const barraAhorro = screen.getByTestId('bar-ahorro')
        const barraGastos = screen.getByTestId('bar-gastos')

        // Orden visual: verde → naranja → rojo.
        // 4 = Node.DOCUMENT_POSITION_FOLLOWING (constante porque eslint no
        // declara el global Node en este entorno).
        const DOCUMENT_POSITION_FOLLOWING = 4

        expect(
            barraIngresos.compareDocumentPosition(barraAhorro) &
                DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy()
        expect(
            barraAhorro.compareDocumentPosition(barraGastos) &
                DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy()

        expect(barraAhorro).toHaveAttribute('data-fill', '#f59e0b')
        expect(barraIngresos).toHaveAttribute('data-fill', '#16a34a')
        expect(barraGastos).toHaveAttribute('data-fill', '#dc2626')

        // La leyenda usa las mismas claves i18n que el resto del tablero.
        expect(barraAhorro).toHaveAttribute('data-name', 'Ahorro')
    })

    it('acumula los movimientos de ahorro en la serie mensual de la gráfica', async () => {
        render(<Dashboard />)

        const chart = await screen.findByTestId('bar-chart')
        const meses = JSON.parse(chart.getAttribute('data-meses'))

        expect(meses).toHaveLength(1)
        expect(meses[0]).toMatchObject({
            ingresos: 1000,
            ahorro: 150,
            gastos: 400,
        })
    })

    it('muestra el balance que ya descuenta el ahorro', async () => {
        render(<Dashboard />)

        // 1000 − 400 − 150 = 450; el componente debe pintar el balance del
        // backend y no recalcular ingresos − gastos.
        expect(
            await screen.findByText(formatearMoneda(RESUMEN.balance))
        ).toBeInTheDocument()
        expect(
            screen.queryByText(formatearMoneda(RESUMEN.totalIngresos - RESUMEN.totalGastos))
        ).not.toBeInTheDocument()
    })
})
