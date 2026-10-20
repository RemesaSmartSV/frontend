import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    render,
    screen,
    fireEvent,
    waitFor,
    cleanup,
} from '@testing-library/react'
import Presupuestos from './Presupuestos'

// T4 — integración del panel flotante de filtros en Presupuestos.
//
// Tests MÍNIMOS de integración (patrón de Movimientos.filtrosMenu.test.jsx);
// NO duplican los tests unitarios de FiltrosMenu. Usa i18n real (el setup
// fuerza `es`), así que además ejercita las claves `filtros.*`.
//
// Lo que se fija aquí es el contrato del T4:
// 1. La búsqueda queda SIEMPRE visible en la fila superior, junto al botón
//    "Filtros" (Presupuestos no tenía fila de búsqueda: ahora sí).
// 2. Los otros cuatro controles (idCategoria, mesAnio, montoMinimo,
//    montoMaximo) siguen montados en el DOM con el panel cerrado.
// 3. El badge cuenta los filtros con valor; el texto-link "Limpiar filtros"
//    ahora vive dentro del panel vía onLimpiar.

const PRESUPUESTOS = [
    {
        idPresupuesto: 1,
        idCategoria: 2,
        montoLimite: 300,
        mesAnio: '2026-09-01T00:00:00Z',
    },
    {
        idPresupuesto: 2,
        idCategoria: 2,
        montoLimite: 150,
        mesAnio: '2026-08-01T00:00:00Z',
    },
]

const CATEGORIAS = [
    { idCategoria: 1, idHogar: 14, nombre: 'Salario', tipo: 'Ingreso', icono: 'x' },
    { idCategoria: 2, idHogar: 14, nombre: 'Comida', tipo: 'Gasto', icono: 'x' },
]

const fetchOriginal = global.fetch

function respuesta(cuerpo) {
    return new Response(JSON.stringify(cuerpo), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
}

// JWT con expiración futura: obtenerToken() decodifica el payload con atob y
// mata la sesión si `exp` ya pasó (api.js:20).
function tokenDePrueba() {
    const cabecera = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(
        JSON.stringify({
            sub: '1',
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
        })
    )
    return `${cabecera}.${payload}.firma`
}

function panelDe(boton) {
    return document.getElementById(boton.getAttribute('aria-controls'))
}

async function montar() {
    render(<Presupuestos />)
    await waitFor(() =>
        expect(document.querySelectorAll('tbody tr')).toHaveLength(2)
    )
}

beforeEach(() => {
    // presupuestosApi.listar responde un array plano; Categorias y
    // Movimientos pasan por listarTodasLasPaginas, que también acepta arrays.
    global.fetch = vi.fn(async (url) => {
        const destino = String(url)

        if (destino.includes('/Presupuestos')) {
            return respuesta(PRESUPUESTOS)
        }

        if (destino.includes('/Categorias')) {
            return respuesta(CATEGORIAS)
        }

        // La página de presupuestos usa los movimientos para el progreso.
        if (destino.includes('/Movimientos')) {
            return respuesta([])
        }

        return respuesta([])
    })

    localStorage.setItem('token', tokenDePrueba())
    localStorage.setItem(
        'usuario',
        JSON.stringify({ idUsuario: 1, correo: 'prueba@remesa.test' })
    )
})

afterEach(() => {
    global.fetch = fetchOriginal
    localStorage.clear()
    cleanup()
})

describe('Presupuestos — panel de filtros (T4)', () => {
    it('la búsqueda queda visible junto a Filtros y los cuatro controles siguen montados con el panel cerrado', async () => {
        await montar()

        const botonFiltros = screen.getByRole('button', { name: 'Filtros' })
        // FiltrosMenu monta su contenedor `relative` dentro de la fila.
        const fila = botonFiltros.parentElement.parentElement
        const buscador = document.querySelector('input[name="busqueda"]')

        expect(fila.contains(buscador)).toBe(true)

        const panel = panelDe(botonFiltros)

        expect(panel.classList.contains('hidden')).toBe(true)
        expect(botonFiltros).toHaveAttribute('aria-expanded', 'false')
        expect(panel.contains(buscador)).toBe(false)

        // Los cuatro controles viven DENTRO del panel y responden aunque
        // esté cerrado: sólo la clase `hidden` los oculta.
        expect(panel.querySelector('[name="idCategoria"]')).toBeTruthy()
        expect(panel.querySelector('[name="mesAnio"]')).toBeTruthy()
        expect(panel.querySelector('[name="montoMinimo"]')).toBeTruthy()
        expect(panel.querySelector('[name="montoMaximo"]')).toBeTruthy()

        fireEvent.change(panel.querySelector('[name="mesAnio"]'), {
            target: { value: '2026-09' },
        })

        expect(document.querySelectorAll('tbody tr')).toHaveLength(1)
    })

    it('el badge cuenta los filtros activos y Limpiar filtros (dentro del panel) lo vacía', async () => {
        await montar()

        const botonFiltros = screen.getByRole('button', { name: 'Filtros' })
        const panel = panelDe(botonFiltros)

        // El texto-link "Limpiar filtros" ya no está fuera: vive en el panel.
        expect(panel.querySelector('[name="montoMaximo"]')).toBeTruthy()
        expect(
            panel.querySelector('button') &&
            screen.getAllByRole('button', { name: 'Limpiar filtros' })
        ).toHaveLength(1)

        // Un filtro activo => variante singular del aria-label + badge "1".
        fireEvent.change(panel.querySelector('select[name="idCategoria"]'), {
            target: { value: '2' },
        })

        let botonConBadge = screen.getByRole('button', {
            name: 'Filtros (1 activo)',
        })
        expect(botonConBadge).toHaveTextContent('1')

        // Abrir el panel y limpiar desde ahí.
        fireEvent.click(botonConBadge)
        expect(panel.classList.contains('hidden')).toBe(false)

        fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

        expect(panel.querySelector('select[name="idCategoria"]').value).toBe('')
        expect(
            screen.getByRole('button', { name: 'Filtros' })
        ).toBeInTheDocument()
        expect(document.querySelectorAll('tbody tr')).toHaveLength(2)
    })
})
