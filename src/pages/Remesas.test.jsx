import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Remesas from './Remesas'

// Mock de useTranslation: devuelve las claves como texto (suficiente para tests).
//
// IMPORTANTE (lección de T14): `t` e `i18n` deben ser referencias ESTABLES
// creadas una sola vez DENTRO del factory de vi.mock. Remesas usa `t` como
// dependencia de useCallback (cargarDatos) y de useEffect; si el mock
// devolviera una función `t` nueva en cada render, el effect se re-dispararía
// en bucle infinito y la página nunca terminaría de cargar.
vi.mock('react-i18next', () => {
    const map = {
        'remesas.titulo': 'Remesas',
        'remesas.descripcion': 'Registro de remesas del hogar.',
        'remesas.anio': 'Año',
        'remesas.totalEnviado': 'Total enviado',
        'remesas.totalRecibido': 'Total recibido',
        'remesas.totalComisiones': 'Total de comisiones',
        'remesas.cantidad': 'Cantidad de remesas',
        'remesas.porCanalTitulo': 'Desglose por canal',
        'remesas.listadoTitulo': 'Remesas del año',
        'remesas.direccion': 'Dirección',
        'remesas.canal': 'Canal',
        'remesas.montoEnviado': 'Monto enviado',
        'remesas.montoRecibido': 'Monto recibido',
        'remesas.comision': 'Comisión',
        'remesas.folio': 'Folio',
        'remesas.notas': 'Notas',
        'remesas.guardar': 'Guardar remesa',
        'remesas.errorRecibidoMayor':
            'El monto recibido no puede ser mayor que el monto enviado.',
    }

    const t = (key) => map[key] || key

    const i18n = { language: 'es', changeLanguage: () => {} }

    return {
        useTranslation: () => ({ t, i18n }),
    }
})

// Mock de global.fetch con las formas REALES del backend: /Remesas devuelve
// un array crudo y /Remesas/resumen el objeto del resumen anual.
let fetchMock
let llamadas
const fetchOriginal = global.fetch

function construirRespuesta(cuerpo, status = 200) {
    return new Response(JSON.stringify(cuerpo), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

const resumenPrueba = {
    anio: 2026,
    totalEnviado: 1000,
    totalRecibido: 960,
    totalComision: 40,
    cantidad: 2,
    porCanal: [
        {
            canal: 'WesternUnion',
            cantidad: 1,
            montoEnviado: 600,
            montoRecibido: 576,
            comision: 24,
        },
    ],
}

const remesasPrueba = [
    {
        idRemesa: 1,
        direccion: 'Recepcion',
        canal: 'WesternUnion',
        montoEnviado: 600,
        montoRecibido: 576,
        comision: 24,
        folio: 'MTCN123',
        notas: 'Envío de familia',
        fecha: '2026-09-01T00:00:00Z',
    },
]

beforeEach(() => {
    llamadas = []

    fetchMock = vi.fn(async (url) => {
        const destino = String(url)
        llamadas.push(destino)

        // El chequeo de resumen va primero: esa URL también contiene /Remesas.
        if (destino.includes('/api/Remesas/resumen')) {
            return construirRespuesta(resumenPrueba)
        }

        if (destino.includes('/api/Remesas')) {
            return construirRespuesta(remesasPrueba)
        }

        return construirRespuesta([])
    })

    global.fetch = fetchMock

    // Defensa: la página usa scroll al editar.
    window.scrollTo = vi.fn()
})

afterEach(() => {
    global.fetch = fetchOriginal
})

describe('Remesas', () => {
    it('renderiza sin error y pide la lista y el resumen al backend', async () => {
        render(<Remesas />)

        expect(
            await screen.findByRole('heading', {
                level: 1,
                name: 'Remesas',
            })
        ).toBeInTheDocument()

        // Prueba de que el estado quedó cableado a los dos GET del registro de remesas.
        await waitFor(() => {
            expect(
                llamadas.some((url) => url.includes('/api/Remesas/resumen'))
            ).toBe(true)
            expect(
                llamadas.some((url) => url.includes('/api/Remesas?'))
            ).toBe(true)
        })
    })

    it('muestra el total de comisiones del resumen anual', async () => {
        render(<Remesas />)

        expect(
            await screen.findByText('Total de comisiones')
        ).toBeInTheDocument()

        // El valor monetario llega formateado (p. ej. "$40.00"); se compara
        // sin el símbolo de moneda para no acoplarse al locale.
        expect(
            await screen.findByText((contenido) =>
                contenido.replace(/\s/g, '').includes('40.00')
            )
        ).toBeInTheDocument()
    })

    it('valida en el formulario que el monto recibido no supere el enviado', async () => {
        render(<Remesas />)

        await screen.findByRole('heading', {
            level: 1,
            name: 'Remesas',
        })

        fireEvent.change(screen.getByLabelText('Monto enviado'), {
            target: { value: '100' },
        })
        fireEvent.change(screen.getByLabelText('Monto recibido'), {
            target: { value: '200' },
        })

        fireEvent.click(
            screen.getByRole('button', { name: 'Guardar remesa' })
        )

        // El error del criterio de negocio aparece en pantalla...
        expect(
            await screen.findByText(
                'El monto recibido no puede ser mayor que el monto enviado.'
            )
        ).toBeInTheDocument()

        // ...y NO se llamó a POST /api/Remesas.
        expect(
            fetchMock.mock.calls.some(
                ([url, opciones]) =>
                    String(url).endsWith('/api/Remesas') &&
                    opciones?.method === 'POST'
            )
        ).toBe(false)
    })

    it('cambia el año vuelve a pedir la lista y el resumen al API', async () => {
        render(<Remesas />)

        await screen.findByRole('heading', {
            level: 1,
            name: 'Remesas',
        })

        // Carga inicial con el año actual.
        await waitFor(() => {
            expect(
                llamadas.some((url) => url.includes('anio='))
            ).toBe(true)
        })

        fireEvent.change(screen.getByLabelText('Año'), {
            target: { value: '2024' },
        })

        // Tanto el listado como el resumen se repiden con el año elegido.
        await waitFor(() => {
            expect(
                llamadas.some(
                    (url) =>
                        url.includes('/api/Remesas?anio=2024')
                )
            ).toBe(true)
            expect(
                llamadas.some(
                    (url) =>
                        url.includes('/api/Remesas/resumen?anio=2024')
                )
            ).toBe(true)
        })
    })
})
