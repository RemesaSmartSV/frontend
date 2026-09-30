import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Dashboard from './Dashboard'

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
})
