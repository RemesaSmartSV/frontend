import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    render,
    screen,
    fireEvent,
    waitFor,
    cleanup,
} from '@testing-library/react'
import Ingresos from './Ingresos'

// T3 — integración del panel flotante de filtros en Ingresos.
//
// Tests MÍNIMOS de integración (patrón de Movimientos.filtrosMenu.test.jsx);
// NO duplican los tests unitarios de FiltrosMenu. Usa i18n real (el setup
// fuerza `es`), así que además ejercita las claves `filtros.*`.
//
// Lo que se fija aquí es el contrato del T3:
// 1. La búsqueda queda SIEMPRE visible en la fila superior, junto al botón
//    "Filtros".
// 2. Los otros cinco controles siguen montados en el DOM con el panel
//    cerrado (ocultos por clase, no por render condicional).
// 3. El badge cuenta los filtros con valor (búsqueda incluida) y el botón
//    abre/cierra el panel.

const INGRESOS = [
    {
        idMovimiento: 1,
        idHogar: 14,
        idCategoria: 1,
        monto: 400,
        fecha: '2026-09-10T12:00:00Z',
        tipo: 'Ingreso',
        descripcion: 'sueldo mensual',
    },
    {
        idMovimiento: 2,
        idHogar: 14,
        idCategoria: 1,
        monto: 250,
        fecha: '2026-08-01T12:00:00Z',
        tipo: 'Ingreso',
        descripcion: 'freelance diseño',
    },
]

// Un gasto NO debe aparecer en Ingresos (la página filtra por tipo).
const GASTO = {
    idMovimiento: 3,
    idHogar: 14,
    idCategoria: 2,
    monto: 120,
    fecha: '2026-09-12T12:00:00Z',
    tipo: 'Gasto',
    descripcion: 'supermercado',
}

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
    render(<Ingresos />)
    await waitFor(() =>
        expect(document.querySelectorAll('tbody tr')).toHaveLength(2)
    )
}

beforeEach(() => {
    // listarTodasLasPaginas acepta arrays planos: no hace falta paginar.
    global.fetch = vi.fn(async (url) => {
        const destino = String(url)

        if (destino.includes('/Movimientos')) {
            return respuesta([GASTO, ...INGRESOS])
        }

        if (destino.includes('/Categorias')) {
            return respuesta(CATEGORIAS)
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

describe('Ingresos — panel de filtros (T3)', () => {
    it('la búsqueda queda visible junto a Filtros y los cinco controles siguen montados con el panel cerrado', async () => {
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

        // Los cinco controles viven DENTRO del panel y responden aunque esté
        // cerrado: sólo la clase `hidden` los oculta, no se desmontan.
        expect(panel.querySelector('[name="fechaDesde"]')).toBeTruthy()
        expect(panel.querySelector('[name="fechaHasta"]')).toBeTruthy()
        expect(panel.querySelector('[name="idCategoria"]')).toBeTruthy()
        expect(panel.querySelector('[name="montoMinimo"]')).toBeTruthy()
        expect(panel.querySelector('[name="montoMaximo"]')).toBeTruthy()

        fireEvent.change(panel.querySelector('[name="fechaDesde"]'), {
            target: { value: '2026-09-01' },
        })

        expect(document.querySelectorAll('tbody tr')).toHaveLength(1)
        expect(
            screen.queryByText('freelance diseño', { selector: 'td' })
        ).not.toBeInTheDocument()
    })

    it('el badge cuenta los filtros activos, el botón abre y cierra el panel y Limpiar filtros lo vacía', async () => {
        await montar()

        let botonFiltros = screen.getByRole('button', { name: 'Filtros' })
        const panel = panelDe(botonFiltros)

        // Un filtro activo => variante singular del aria-label + badge "1".
        fireEvent.change(panel.querySelector('select[name="idCategoria"]'), {
            target: { value: '1' },
        })

        botonFiltros = screen.getByRole('button', { name: 'Filtros (1 activo)' })
        expect(botonFiltros).toHaveTextContent('1')

        // Abrir y cerrar el panel con el botón.
        fireEvent.click(botonFiltros)
        expect(botonFiltros).toHaveAttribute('aria-expanded', 'true')
        expect(panel.classList.contains('hidden')).toBe(false)

        fireEvent.click(botonFiltros)
        expect(botonFiltros).toHaveAttribute('aria-expanded', 'false')
        expect(panel.classList.contains('hidden')).toBe(true)

        // "Limpiar filtros" (dentro del panel) vacía todo y baja el badge.
        fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

        expect(panel.querySelector('select[name="idCategoria"]').value).toBe('')
        expect(
            screen.getByRole('button', { name: 'Filtros' })
        ).toBeInTheDocument()
    })
})
