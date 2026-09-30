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

// Verificacion de #73: "navegar todas las pagginas y verificar que cargan,
// filtran y exportan correctamente".
//
// "cargan" lo cubre App.routes.test.jsx (smoke de las 8 rutas). Este archivo
// cubre las dos palabras que faltaban: FILTRAN y EXPORTAN, verificando que la
// interfaz hace lo que el usuario espera cuando toca los controles.
//
// Dos observaciones que motivan estas pruebas:
//
// 1. Los filtros de esta pagina son CLIENT-SIDE (useMemo sobre `movimientos`),
//    no viajan al backend. Por eso el bug 500 de ?fechaInicio en
//    MovimientosController no es alcanzable desde la UI: aqui se filtra en el
//    navegador. El test fija ese comportamiento para que nadie lo "arregle"
//    cambiando el lado del filtro sin darse cuenta.
// 2. Hay TRES botones de exportar: "CSV filtrado" (genera el archivo en el
//    cliente a partir de las filas visibles) y "CSV"/"JSON" (van al endpoint
//    /Movimientos/exportar). Se prueban los tres, porque son rutas distintas.

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
        idUsuario: 16,
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

let fetchMock
let llamadas
let crearUrlSpy
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

// JWT con expiracion futura: obtenerToken() decodifica el payload con atob y
// mata la sesion si `exp` ya paso (api.js:20).
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

function leerTexto(blob) {
    return new Promise((resolver, rechazar) => {
        const lector = new FileReader()
        lector.onload = () => resolver(lector.result)
        lector.onerror = () => rechazar(lector.error)
        lector.readAsText(blob)
    })
}

// Los controles viven en el panel de filtros y comparten texto de etiqueta
// con el formulario de alta (ambos dicen "Categoría"), asi que se buscan por
// id: es la referencia que el propio componente declara.
function control(id) {
    return document.getElementById(id)
}

async function montar() {
    const vista = render(<Movimientos />)
    await screen.findByText('supermercado')
    return vista
}

beforeEach(() => {
    llamadas = []

    fetchMock = vi.fn(async (url) => {
        const destino = String(url)
        llamadas.push(destino)

        // OJO: /Movimientos/exportar contiene "/Movimientos", asi que debe
        // evaluarse ANTES que el listado.
        if (destino.includes('/Movimientos/exportar')) {
            return new Response(
                'Id,Fecha,Tipo,Categoria,Monto,Descripcion,Origen\n' +
                    '2,"2026-09-12T12:00:00.0000000Z","Gasto","Comida",120.00,"supermercado","Efectivo"\n',
                {
                    status: 200,
                    headers: { 'Content-Type': 'text/csv' },
                }
            )
        }

        if (destino.includes('/Movimientos')) {
            return respuesta(paginado(MOVIMIENTOS))
        }

        if (destino.includes('/Categorias')) {
            return respuesta(paginado(CATEGORIAS))
        }

        return respuesta(paginado([]))
    })

    global.fetch = fetchMock

    // jsdom no implementa el ciclo de vida de object URLs.
    crearUrlSpy = vi.fn(() => 'blob:prueba')
    URL.createObjectURL = crearUrlSpy
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

describe('Movimientos — carga', () => {
    it('pide movimientos y categorías al backend y pinta las tres filas', async () => {
        await montar()

        expect(screen.getByText('sueldo mensual')).toBeInTheDocument()
        expect(screen.getByText('supermercado')).toBeInTheDocument()
        expect(screen.getByText('transporte urbano')).toBeInTheDocument()

        expect(
            llamadas.some((url) => url.includes('/Movimientos'))
        ).toBe(true)
        expect(
            llamadas.some((url) => url.includes('/Categorias'))
        ).toBe(true)
    })

    it('muestra el nombre de la categoría en cada fila', async () => {
        await montar()

        // Se acota a la tabla: el <option> del select de filtros también
        // contiene el nombre de la categoría y contaminaría el conteo.
        const tabla = screen.getByRole('table')

        expect(within(tabla).getAllByText('Comida')).toHaveLength(2)
        expect(within(tabla).getAllByText('Salario')).toHaveLength(1)
    })
})

describe('Movimientos — filtros', () => {
    it('filtra por descripción (o por origen)', async () => {
        await montar()

        fireEvent.change(control('busquedaMovimientos'), {
            target: { value: 'supermercado' },
        })

        expect(screen.getByText('supermercado')).toBeInTheDocument()
        expect(screen.queryByText('sueldo mensual')).not.toBeInTheDocument()
        expect(screen.queryByText('transporte urbano')).not.toBeInTheDocument()
    })

    it('filtra por origen cuando el término no está en la descripción', async () => {
        await montar()

        fireEvent.change(control('busquedaMovimientos'), {
            target: { value: 'transferencia' },
        })

        expect(screen.getByText('sueldo mensual')).toBeInTheDocument()
        expect(screen.queryByText('supermercado')).not.toBeInTheDocument()
        expect(screen.queryByText('transporte urbano')).not.toBeInTheDocument()
    })

    it('filtra por categoría', async () => {
        await montar()

        fireEvent.change(control('filtroCategoriaMovimientos'), {
            target: { value: '2' },
        })

        expect(screen.getByText('supermercado')).toBeInTheDocument()
        expect(screen.getByText('transporte urbano')).toBeInTheDocument()
        expect(screen.queryByText('sueldo mensual')).not.toBeInTheDocument()
    })

    it('filtra por fecha desde', async () => {
        await montar()

        fireEvent.change(control('fechaDesde'), {
            target: { value: '2026-09-01' },
        })

        expect(screen.getByText('sueldo mensual')).toBeInTheDocument()
        expect(screen.getByText('supermercado')).toBeInTheDocument()
        expect(screen.queryByText('transporte urbano')).not.toBeInTheDocument()
    })

    it('filtra por fecha hasta', async () => {
        await montar()

        fireEvent.change(control('fechaHasta'), {
            target: { value: '2026-08-31' },
        })

        expect(screen.getByText('transporte urbano')).toBeInTheDocument()
        expect(screen.queryByText('sueldo mensual')).not.toBeInTheDocument()
        expect(screen.queryByText('supermercado')).not.toBeInTheDocument()
    })

    it('filtra por rango de monto', async () => {
        await montar()

        fireEvent.change(control('montoMinimo'), {
            target: { value: '300' },
        })

        expect(screen.getByText('sueldo mensual')).toBeInTheDocument()
        expect(screen.queryByText('supermercado')).not.toBeInTheDocument()
        expect(screen.queryByText('transporte urbano')).not.toBeInTheDocument()
    })

    it('acumula varios filtros a la vez', async () => {
        await montar()

        // Categoría Comida (2) + monto mínimo 100 => sólo supermercado.
        fireEvent.change(control('filtroCategoriaMovimientos'), {
            target: { value: '2' },
        })
        fireEvent.change(control('montoMinimo'), {
            target: { value: '100' },
        })

        expect(screen.getByText('supermercado')).toBeInTheDocument()
        expect(screen.queryByText('transporte urbano')).not.toBeInTheDocument()
        expect(screen.queryByText('sueldo mensual')).not.toBeInTheDocument()
    })

    it('"Limpiar filtros" vacía los controles y devuelve las tres filas', async () => {
        await montar()

        // Categoría Comida (2 filas) + monto mínimo 100 => sólo supermercado.
        // La tabla NO queda vacía a propósito: con 0 filas el panel de estado
        // vacío añade un segundo botón "Limpiar filtros" y el selector dejaría
        // de ser único.
        fireEvent.change(control('filtroCategoriaMovimientos'), {
            target: { value: '2' },
        })
        fireEvent.change(control('montoMinimo'), {
            target: { value: '100' },
        })

        expect(screen.getByText('supermercado')).toBeInTheDocument()
        expect(screen.queryByText('sueldo mensual')).not.toBeInTheDocument()
        expect(screen.queryByText('transporte urbano')).not.toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', { name: 'Limpiar filtros' })
        )

        expect(control('busquedaMovimientos').value).toBe('')
        expect(control('montoMinimo').value).toBe('')
        expect(control('filtroCategoriaMovimientos').value).toBe('')

        expect(screen.getByText('sueldo mensual')).toBeInTheDocument()
        expect(screen.getByText('supermercado')).toBeInTheDocument()
        expect(screen.getByText('transporte urbano')).toBeInTheDocument()
    })

    it('muestra el estado vacío cuando nada coincide', async () => {
        await montar()

        fireEvent.change(control('busquedaMovimientos'), {
            target: { value: 'zzz-no-existe' },
        })

        expect(
            await screen.findByText(
                /No hay movimientos que coincidan con los filtros\./
            )
        ).toBeInTheDocument()
        expect(screen.queryByText('supermercado')).not.toBeInTheDocument()
    })
})

describe('Movimientos — exportación', () => {
    it('"CSV filtrado" genera el archivo en el cliente con SOLO las filas visibles', async () => {
        await montar()

        // Filtro a una sola fila antes de exportar.
        fireEvent.change(control('busquedaMovimientos'), {
            target: { value: 'supermercado' },
        })
        expect(screen.getByText('supermercado')).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', { name: 'CSV filtrado' })
        )

        await waitFor(() => expect(crearUrlSpy).toHaveBeenCalledTimes(1))

        const [blob] = crearUrlSpy.mock.calls[0]
        expect(blob.type).toContain('text/csv')

        const contenido = await leerTexto(blob)

        // escaparCSV() envuelve CADA campo en comillas dobles (y neutraliza
        // los prefijos =+-@ contra inyección de fórmulas en Excel).
        expect(contenido).toContain('"Fecha","Tipo"')
        expect(contenido).toContain(
            '"2026-09-12","Gasto","Comida","120.00","supermercado","Efectivo"'
        )
        // El punto clave: lo filtrado NO se cuela en el archivo.
        expect(contenido).not.toContain('sueldo mensual')
        expect(contenido).not.toContain('transporte urbano')

        expect(
            screen.getByText(
                /1 movimiento\(s\) exportado\(s\) correctamente\./
            )
        ).toBeInTheDocument()
    })

    it('"CSV filtrado" queda deshabilitado si el filtro dejó la tabla vacía', async () => {
        await montar()

        fireEvent.change(control('busquedaMovimientos'), {
            target: { value: 'zzz-no-existe' },
        })
        await screen.findByText(
            /No hay movimientos que coincidan con los filtros\./
        )

        // El botón se deshabilita con movimientosFiltrados.length === 0, así
        // que nunca llega a generar un archivo vacío ni a avisar con error.
        const boton = screen.getByRole('button', { name: 'CSV filtrado' })
        expect(boton).toBeDisabled()

        fireEvent.click(boton)

        expect(crearUrlSpy).not.toHaveBeenCalled()
    })

    it('"CSV" va al endpoint remoto /Movimientos/exportar?formato=csv', async () => {
        await montar()

        fireEvent.click(screen.getByRole('button', { name: /^CSV$/ }))

        await waitFor(() => {
            expect(
                llamadas.some((url) =>
                    url.includes('/Movimientos/exportar?formato=csv')
                )
            ).toBe(true)
        })

        expect(crearUrlSpy).toHaveBeenCalledTimes(1)
    })

    it('"JSON" va al endpoint remoto con formato=json', async () => {
        await montar()

        fireEvent.click(screen.getByRole('button', { name: /^JSON$/ }))

        await waitFor(() => {
            expect(
                llamadas.some((url) =>
                    url.includes('/Movimientos/exportar?formato=json')
                )
            ).toBe(true)
        })
    })
})
