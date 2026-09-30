import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import App from './App'

// Smoke test de navegacion.
//
// Su motivo de existir: durante la integracion de las ramas del equipo,
// Dashboard.jsx quedo referenciando un identificador `categorias` que nunca
// se declaro. Como la app no tiene ErrorBoundary, ese ReferenceError desmontaba
// el arbol completo y dejaba la pantalla en blanco DESPUES del login.
// Este test monta <App/> con sesion activa en TODAS las rutas registradas,
// de modo que cualquier crash de render en cualquier pagina vuelva a fallar
// aqui y no en produccion.

let fetchMock
const fetchOriginal = global.fetch

function respuesta(cuerpo) {
    return new Response(JSON.stringify(cuerpo), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
}

// JWT con expiracion futura: obtenerToken() decodifica el payload con atob
// y borra la sesion si `exp` ya paso.
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

const RUTAS = [
    { ruta: '/', titulo: /Resumen financiero/i },
    { ruta: '/movimientos', titulo: /Movimientos financieros/i },
    { ruta: '/categorias', titulo: /^Categor/i },
    { ruta: '/remesas', titulo: /^Remesas$/i },
    { ruta: '/ingresos', titulo: /^Ingresos$/i },
    { ruta: '/gastos', titulo: /^Gastos$/i },
    { ruta: '/presupuestos', titulo: /^Presupuestos$/i },
    { ruta: '/educacion-financiera', titulo: /Educaci/i },
]

beforeEach(() => {
    fetchMock = vi.fn(async (url) => {
        const destino = String(url)

        if (destino.includes('/Hogares')) {
            return respuesta({
                idHogar: 1,
                nombreFamiliar: 'Hogar de Prueba',
                fechaCreacion: '2026-09-30T17:13:31.2790560Z',
            })
        }

        if (destino.includes('/Alertas/')) {
            return respuesta([])
        }

        if (destino.includes('/resumen')) {
            return respuesta({
                totalIngresos: 0,
                totalGastos: 0,
                balance: 0,
            })
        }

        // El backend devuelve arrays crudos en Categorias, Movimientos,
        // Presupuestos y TipsFinancieros; el frontend acepta array o
        // envoltorio paginado (extraerItems / listarTodasLasPaginas).
        return respuesta([])
    })

    global.fetch = fetchMock
    window.scrollTo = vi.fn()

    localStorage.setItem('token', tokenDePrueba())
    localStorage.setItem(
        'usuario',
        JSON.stringify({ idUsuario: 1, correo: 'prueba@remesa.test' })
    )
    window.history.pushState({}, '', '/')
})

afterEach(() => {
    global.fetch = fetchOriginal
    localStorage.clear()
    cleanup()
})

describe('Rutas autenticadas', () => {
    it.each(RUTAS)('$ruta renderiza su pagina sin excepciones', async ({
        ruta,
        titulo,
    }) => {
        window.history.pushState({}, '', ruta)

        render(<App />)

        // Si algun componente lanza durante el render, React desmonta el
        // arbol y findByRole nunca encuentra el encabezado -> el test falla.
        const encabezado = await screen.findByRole('heading', {
            level: 1,
            name: titulo,
        })

        expect(encabezado).toBeInTheDocument()

        // El Layout (y por lo tanto la navegacion del menu) debe estar vivo.
        expect(document.querySelectorAll('a[href]').length).toBeGreaterThanOrEqual(
            8
        )
    })

    it('la ruta desconocida no deja la app en blanco', async () => {
        window.history.pushState({}, '', '/ruta-que-no-existe')

        render(<App />)

        // No existe un catch-all en el router: se verifica al menos que el
        // layout de navegacion siga montado y no haya colapsado.
        expect(document.querySelectorAll('a[href]').length).toBeGreaterThanOrEqual(
            8
        )
    })
})
