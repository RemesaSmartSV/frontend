import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    render,
    screen,
    fireEvent,
    waitFor,
    within,
    cleanup,
} from '@testing-library/react'
import Movimientos from './Movimientos'
import { formatearFecha, formatearMoneda } from '../utils/formato'

// T12 — vista móvil de Movimientos.
//
// La página pinta DOS representaciones de los mismos datos: la tabla de 8
// columnas (`hidden sm:block`, ≥640px) y una lista de tarjetas (`sm:hidden`,
// <640px). jsdom no aplica media queries, así que AMBAS conviven en el DOM y
// toda aserción de contenido tiene que acotarse a la vista que interesa.
//
// Estas pruebas cubren lo que la vista de tarjetas agrega de verdad:
//
// 1. Que existan las dos representaciones conmutadas por la clase que les
//    corresponde (es el único contrato que jsdom puede comprobar, porque el
//    resto del sistema —visibilidad real— depende del navegador).
// 2. Que cada tarjeta repita los datos de su fila: categoría, fecha, monto
//    teñido por tipo, miembro, origen y las dos acciones.
// 3. Que las acciones de la tarjeta manejen los MISMOS flujos que las de la
//    tabla (editar carga el formulario, eliminar abre la confirmación).

const MOVIMIENTOS = [
    {
        idMovimiento: 1,
        idHogar: 14,
        idUsuario: 16,
        idCategoria: 1,
        monto: 400,
        fecha: '2026-09-10T12:00:00Z',
        tipo: 'Ingreso',
        descripcion: 'sueldo mensual',
        origenEmisora: 'Transferencia',
    },
    {
        idMovimiento: 2,
        idHogar: 14,
        idUsuario: 17,
        idCategoria: 2,
        monto: 120,
        fecha: '2026-09-12T12:00:00Z',
        tipo: 'Gasto',
        descripcion: 'supermercado',
        origenEmisora: 'Efectivo',
    },
]

const CATEGORIAS = [
    { idCategoria: 1, idHogar: 14, nombre: 'Salario', tipo: 'Ingreso', icono: 'x' },
    { idCategoria: 2, idHogar: 14, nombre: 'Comida', tipo: 'Gasto', icono: 'x' },
]

const MIEMBROS = [
    {
        idUsuario: 16,
        nombre: 'María',
        apellido: 'López',
        nombreVisible: 'María L.',
        correo: 'maria@remesa.test',
        rol: 'Admin',
    },
    {
        idUsuario: 17,
        nombre: 'Juan',
        apellido: 'Pérez',
        nombreVisible: null,
        correo: 'juan@remesa.test',
        rol: 'Miembro',
    },
]

const fetchOriginal = global.fetch

function respuesta(cuerpo) {
    return new Response(JSON.stringify(cuerpo), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
}

function paginado(items) {
    return {
        items,
        total: items.length,
        page: 1,
        pageSize: 100,
        totalPages: 1,
    }
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

// La lista de tarjetas es la representación <640px. Se busca por su nombre
// accesible (aria-label) porque en la página puede haber otras listas.
function listaDeTarjetas() {
    return screen.getByRole('list', { name: 'Movimientos' })
}

// Cada tarjeta es el ancestro <li> del texto de su descripción.
function tarjetaDe(descripcion) {
    return within(listaDeTarjetas())
        .getByText(descripcion)
        .closest('li')
}

async function montar() {
    const vista = render(<Movimientos />)
    await waitFor(() =>
        expect(document.querySelectorAll('tbody tr')).toHaveLength(
            MOVIMIENTOS.length
        )
    )
    return vista
}

beforeEach(() => {
    global.fetch = vi.fn(async (url) => {
        const destino = String(url)

        // OJO: /Movimientos/exportar contiene "/Movimientos", así que debe
        // evaluarse ANTES que el listado.
        if (destino.includes('/Movimientos/exportar')) {
            return new Response('Id,Fecha\n', {
                status: 200,
                headers: { 'Content-Type': 'text/csv' },
            })
        }

        if (destino.includes('/Movimientos')) {
            return respuesta(paginado(MOVIMIENTOS))
        }

        if (destino.includes('/Categorias')) {
            return respuesta(paginado(CATEGORIAS))
        }

        // GetMiembros responde un array plano, no un PaginatedResponse.
        if (destino.includes('/Usuarios')) {
            return respuesta(MIEMBROS)
        }

        return respuesta(paginado([]))
    })

    // jsdom no implementa el ciclo de vida de object URLs ni el scroll
    // programático (editarMovimiento hace window.scrollTo).
    URL.createObjectURL = vi.fn(() => 'blob:prueba')
    URL.revokeObjectURL = vi.fn()
    window.scrollTo = vi.fn()

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

describe('Movimientos — vista de tarjetas (T12)', () => {
    it('monta las dos representaciones y las conmuta con las clases de visibilidad', async () => {
        await montar()

        // Tabla: visible solo desde `sm` (≥640px).
        const tabla = screen.getByRole('table')
        expect(tabla.closest('div').className).toContain('hidden')
        expect(tabla.closest('div').className).toContain('sm:block')

        // Tarjetas: visibles solo por debajo de `sm`.
        const lista = listaDeTarjetas()
        expect(lista.className).toContain('sm:hidden')
        expect(lista).toHaveAttribute('aria-label', 'Movimientos')
        expect(lista.querySelectorAll('li')).toHaveLength(MOVIMIENTOS.length)
    })

    it('cada tarjeta repite los datos de su fila, con color por tipo y sus acciones', async () => {
        await montar()

        const ingreso = tarjetaDe('sueldo mensual')

        expect(within(ingreso).getByText('Salario')).toBeInTheDocument()
        expect(within(ingreso).getByText(formatearFecha(MOVIMIENTOS[0].fecha))).toBeInTheDocument()
        expect(within(ingreso).getByText('María L.')).toBeInTheDocument()
        expect(within(ingreso).getByText('Transferencia')).toBeInTheDocument()

        const badge = within(ingreso).getByText('Ingreso')
        expect(badge.className).toContain('bg-green-100')

        const monto = within(ingreso).getByText(formatearMoneda(400))
        expect(monto.className).toContain('text-green-600')

        expect(
            within(ingreso).getByRole('button', { name: 'Editar' })
        ).toBeInTheDocument()
        expect(
            within(ingreso).getByRole('button', { name: 'Eliminar' })
        ).toBeInTheDocument()

        const gasto = tarjetaDe('supermercado')

        expect(within(gasto).getByText('Comida')).toBeInTheDocument()
        expect(within(gasto).getByText('Juan Pérez')).toBeInTheDocument()

        const badgeGasto = within(gasto).getByText('Gasto')
        expect(badgeGasto.className).toContain('bg-red-100')

        const montoGasto = within(gasto).getByText(formatearMoneda(120))
        expect(montoGasto.className).toContain('text-red-600')
    })

    it('"Editar" desde la tarjeta carga el movimiento en el formulario', async () => {
        await montar()

        fireEvent.click(
            within(tarjetaDe('sueldo mensual')).getByRole('button', {
                name: 'Editar',
            })
        )

        expect(document.getElementById('monto').value).toBe('400')
        expect(document.getElementById('descripcion').value).toBe('sueldo mensual')
        expect(
            screen.getByRole('button', { name: 'Cancelar' })
        ).toBeInTheDocument()
    })

    it('"Eliminar" desde la tarjeta abre la confirmación del modal', async () => {
        await montar()

        fireEvent.click(
            within(tarjetaDe('supermercado')).getByRole('button', {
                name: 'Eliminar',
            })
        )

        const dialog = screen.getByRole('dialog')

        expect(
            within(dialog).getByText('Eliminar movimiento')
        ).toBeInTheDocument()
        expect(
            within(dialog).getByRole('button', { name: 'Eliminar' })
        ).toBeInTheDocument()
        expect(
            within(dialog).getByRole('button', { name: 'Cancelar' })
        ).toBeInTheDocument()
    })
})
