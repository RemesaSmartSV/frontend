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
// 3. La columna "Registrado por" resuelve idUsuario → nombre con /Usuarios
//    en el NAVEGADOR (el API devuelve la entidad cruda). El filtro por
//    miembro es también client-side, igual que el resto del panel.

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
        // idUsuario 99 NO existe en MIEMBROS: sirve para comprobar que la
        // columna "Registrado por" degrada sin romper la fila.
        idUsuario: 99,
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

// Devueltos por /Usuarios como array plano (GetMiembros no pagina). María
// usa nombreVisible; Juan no, para ejercitar el armado "Nombre Apellido".
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

// T12: la página monta DOS representaciones a la vez (tabla en ≥640px y
// lista de tarjetas en <640px) y jsdom no aplica media queries, así que
// ambas conviven en el DOM. Cualquier `screen.getByText` encontraría dos
// nodos y fallaría con "found multiple elements". Toda aserción de
// CONTENIDO se acota a la tabla; la vista de tarjetas se cubre en
// Movimientos.mobile.test.jsx. Las aserciones negativas (`queryByText`)
// siguen siendo de pantalla completa: son más fuertes así.
function enTabla(texto) {
    return within(screen.getByRole('table')).getByText(texto)
}

async function montar() {
    const vista = render(<Movimientos />)
    // `findByText('supermercado')` ya no sirve: el texto existe también en
    // las tarjetas. Se espera a que la tabla tenga las tres filas.
    await waitFor(() =>
        expect(document.querySelectorAll('tbody tr')).toHaveLength(3)
    )
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

        // GetMiembros responde un array plano, no un PaginatedResponse.
        if (destino.includes('/Usuarios')) {
            return respuesta(MIEMBROS)
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

        expect(enTabla('sueldo mensual')).toBeInTheDocument()
        expect(enTabla('supermercado')).toBeInTheDocument()
        expect(enTabla('transporte urbano')).toBeInTheDocument()

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

        expect(enTabla('supermercado')).toBeInTheDocument()
        expect(screen.queryByText('sueldo mensual')).not.toBeInTheDocument()
        expect(screen.queryByText('transporte urbano')).not.toBeInTheDocument()
    })

    it('filtra por origen cuando el término no está en la descripción', async () => {
        await montar()

        fireEvent.change(control('busquedaMovimientos'), {
            target: { value: 'transferencia' },
        })

        expect(enTabla('sueldo mensual')).toBeInTheDocument()
        expect(screen.queryByText('supermercado')).not.toBeInTheDocument()
        expect(screen.queryByText('transporte urbano')).not.toBeInTheDocument()
    })

    it('filtra por categoría', async () => {
        await montar()

        fireEvent.change(control('filtroCategoriaMovimientos'), {
            target: { value: '2' },
        })

        expect(enTabla('supermercado')).toBeInTheDocument()
        expect(enTabla('transporte urbano')).toBeInTheDocument()
        expect(screen.queryByText('sueldo mensual')).not.toBeInTheDocument()
    })

    it('filtra por fecha desde', async () => {
        await montar()

        fireEvent.change(control('fechaDesde'), {
            target: { value: '2026-09-01' },
        })

        expect(enTabla('sueldo mensual')).toBeInTheDocument()
        expect(enTabla('supermercado')).toBeInTheDocument()
        expect(screen.queryByText('transporte urbano')).not.toBeInTheDocument()
    })

    it('filtra por fecha hasta', async () => {
        await montar()

        fireEvent.change(control('fechaHasta'), {
            target: { value: '2026-08-31' },
        })

        expect(enTabla('transporte urbano')).toBeInTheDocument()
        expect(screen.queryByText('sueldo mensual')).not.toBeInTheDocument()
        expect(screen.queryByText('supermercado')).not.toBeInTheDocument()
    })

    it('filtra por rango de monto', async () => {
        await montar()

        fireEvent.change(control('montoMinimo'), {
            target: { value: '300' },
        })

        expect(enTabla('sueldo mensual')).toBeInTheDocument()
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

        expect(enTabla('supermercado')).toBeInTheDocument()
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

        expect(enTabla('supermercado')).toBeInTheDocument()
        expect(screen.queryByText('sueldo mensual')).not.toBeInTheDocument()
        expect(screen.queryByText('transporte urbano')).not.toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', { name: 'Limpiar filtros' })
        )

        expect(control('busquedaMovimientos').value).toBe('')
        expect(control('montoMinimo').value).toBe('')
        expect(control('filtroCategoriaMovimientos').value).toBe('')

        expect(enTabla('sueldo mensual')).toBeInTheDocument()
        expect(enTabla('supermercado')).toBeInTheDocument()
        expect(enTabla('transporte urbano')).toBeInTheDocument()
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

describe('Movimientos — atribución', () => {
    it('muestra "Registrado por" con el nombre del miembro', async () => {
        await montar()

        const tabla = screen.getByRole('table')

        // idUsuario 16 tiene nombreVisible "María L." y registró dos filas.
        expect(within(tabla).getAllByText('María L.')).toHaveLength(2)

        // idUsuario 99 no existe en /Usuarios: la fila degrada sin romperse.
        expect(within(tabla).getByText('Desconocido')).toBeInTheDocument()
        expect(
            within(tabla).getByText('transporte urbano')
        ).toBeInTheDocument()
    })

    it('filtra por miembro', async () => {
        await montar()

        fireEvent.change(control('filtroMiembroMovimientos'), {
            target: { value: '16' },
        })

        expect(enTabla('sueldo mensual')).toBeInTheDocument()
        expect(enTabla('supermercado')).toBeInTheDocument()
        expect(
            screen.queryByText('transporte urbano')
        ).not.toBeInTheDocument()

        // Volver a "Todos los miembros" restaura las tres filas.
        fireEvent.change(control('filtroMiembroMovimientos'), {
            target: { value: '' },
        })

        expect(enTabla('transporte urbano')).toBeInTheDocument()
    })
})

describe('Movimientos — exportación', () => {
    it('"CSV filtrado" genera el archivo en el cliente con SOLO las filas visibles', async () => {
        await montar()

        // Filtro a una sola fila antes de exportar.
        fireEvent.change(control('busquedaMovimientos'), {
            target: { value: 'supermercado' },
        })
        expect(enTabla('supermercado')).toBeInTheDocument()

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

    it('"CSV filtrado" incluye la columna del autor al final de la fila', async () => {
        await montar()

        // Filtro a una sola fila (idUsuario 16 → "María L.") antes de exportar.
        fireEvent.change(control('busquedaMovimientos'), {
            target: { value: 'supermercado' },
        })
        expect(enTabla('supermercado')).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', { name: 'CSV filtrado' })
        )

        await waitFor(() => expect(crearUrlSpy).toHaveBeenCalledTimes(1))

        const [blob] = crearUrlSpy.mock.calls[0]
        const contenido = await leerTexto(blob)

        // 7 encabezados y 7 campos por fila: el autor se agrega al FINAL
        // para no romper el orden de las columnas existentes.
        expect(contenido).toContain(
            '"Fecha","Tipo","Categoría","Monto","Descripción","Origen","Registrado por"'
        )
        expect(contenido).toContain(
            '"2026-09-12","Gasto","Comida","120.00","supermercado","Efectivo","María L."'
        )
        expect(contenido).not.toContain('Desconocido')
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
