import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    render,
    screen,
    fireEvent,
    waitFor,
    cleanup,
} from '@testing-library/react'
import Movimientos from './Movimientos'

// T2 — integración del panel flotante de filtros en Movimientos.
//
// A diferencia de Movimientos.filtrosExport.test.jsx, ESTE archivo no mockea
// react-i18next: usa i18n real (el setup fuerza `es`), así que además de la
// integración ejercita las claves nuevas `filtros.*` y su variante plural
// (`Filtros (1 activo)` vs `Filtros (2 activos)`).
//
// Lo que se fija aquí es el contrato del T2:
// 1. La búsqueda queda SIEMPRE visible en la fila superior, junto al botón
//    "Filtros" y a las acciones de exportar/actualizar.
// 2. Los otros seis controles siguen montados en el DOM con el panel cerrado
//    (ocultos por clase, no por render condicional) y responden a sus
//    eventos por id.
// 3. El badge cuenta los filtros con valor (búsqueda incluida) y el botón
//    abre/cierra el panel exponiendo aria-expanded.

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
        idUsuario: 16,
        idCategoria: 2,
        monto: 120,
        fecha: '2026-09-12T12:00:00Z',
        tipo: 'Gasto',
        descripcion: 'supermercado',
        origenEmisora: 'Efectivo',
    },
    {
        idMovimiento: 3,
        idHogar: 14,
        idUsuario: 17,
        idCategoria: 2,
        monto: 55.5,
        fecha: '2026-08-01T12:00:00Z',
        tipo: 'Gasto',
        descripcion: 'transporte urbano',
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

function control(id) {
    return document.getElementById(id)
}

function panelDe(boton) {
    return document.getElementById(boton.getAttribute('aria-controls'))
}

async function montar() {
    render(<Movimientos />)
    await waitFor(() =>
        expect(document.querySelectorAll('tbody tr')).toHaveLength(3)
    )
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

describe('Movimientos — panel de filtros (T2)', () => {
    it('la búsqueda y Filtros quedan en la fila; las acciones se agrupan junto al título', async () => {
        await montar()

        const botonFiltros = screen.getByRole('button', { name: 'Filtros' })
        // FiltrosMenu monta su contenedor `relative` dentro de la fila.
        const fila = botonFiltros.parentElement.parentElement
        // La fila vive dentro de la card (section) de filtros.
        const seccion = fila.parentElement

        expect(
            fila.contains(control('busquedaMovimientos'))
        ).toBe(true)

        // El botón "Filtros" queda al FINAL de la fila: los botones de
        // exportar/actualizar ya no lo empujan hacia la izquierda, que es
        // lo que el anclaje `right-0` del panel necesita para no desbordar.
        expect(fila.lastElementChild).toBe(botonFiltros.parentElement)

        const botonCSVFiltrado = screen.getByRole('button', {
            name: 'CSV filtrado',
        })
        const botonActualizar = screen.getByRole('button', {
            name: 'Actualizar',
        })

        expect(seccion.contains(botonCSVFiltrado)).toBe(true)
        expect(seccion.contains(botonActualizar)).toBe(true)
        expect(fila.contains(botonCSVFiltrado)).toBe(false)
        expect(fila.contains(botonActualizar)).toBe(false)
    })

    it('los controles del panel siguen respondiendo por id con el panel cerrado', async () => {
        await montar()

        const botonFiltros = screen.getByRole('button', { name: 'Filtros' })
        const panel = panelDe(botonFiltros)

        expect(panel.classList.contains('hidden')).toBe(true)
        expect(botonFiltros).toHaveAttribute('aria-expanded', 'false')

        // Cambiar un control dentro del panel cerrado filtra igual: el nodo
        // está montado, sólo la clase `hidden` lo oculta visualmente.
        fireEvent.change(control('fechaDesde'), {
            target: { value: '2026-09-01' },
        })

        expect(document.querySelectorAll('tbody tr')).toHaveLength(2)
        expect(
            screen.queryByText('transporte urbano', { selector: 'td' })
        ).not.toBeInTheDocument()
    })

    it('el badge cuenta los filtros activos (con plural) y el botón abre y cierra el panel', async () => {
        await montar()

        let botonFiltros = screen.getByRole('button', { name: 'Filtros' })
        const panel = panelDe(botonFiltros)

        // Un filtro activo => variante singular del aria-label + badge "1".
        fireEvent.change(control('filtroCategoriaMovimientos'), {
            target: { value: '2' },
        })

        botonFiltros = screen.getByRole('button', { name: 'Filtros (1 activo)' })
        expect(botonFiltros).toHaveTextContent('1')

        // Dos filtros activos => variante plural.
        fireEvent.change(control('montoMinimo'), {
            target: { value: '100' },
        })

        botonFiltros = screen.getByRole('button', { name: 'Filtros (2 activos)' })
        expect(botonFiltros).toHaveTextContent('2')

        // Abrir y cerrar el panel con el botón.
        fireEvent.click(botonFiltros)
        expect(botonFiltros).toHaveAttribute('aria-expanded', 'true')
        expect(panel.classList.contains('hidden')).toBe(false)

        fireEvent.click(botonFiltros)
        expect(botonFiltros).toHaveAttribute('aria-expanded', 'false')
        expect(panel.classList.contains('hidden')).toBe(true)

        // "Limpiar filtros" (dentro del panel) vacía todo y baja el badge a
        // "Filtros"; el botón existe y funciona aunque el panel esté cerrado
        // (contrato R2: nada se desmonta).
        fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

        expect(control('filtroCategoriaMovimientos').value).toBe('')
        expect(control('montoMinimo').value).toBe('')
        expect(document.querySelectorAll('tbody tr')).toHaveLength(3)
        expect(screen.getByRole('button', { name: 'Filtros' })).toBeInTheDocument()
    })
})
