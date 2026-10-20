import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import App from './App'

// Mock de useTranslation para que los tests no dependan de i18n.
//
// `t` se define FUERA de la fábrica (referencia estable): con una función
// nueva por render, todo componente con useCallback/useEffect que dependa de
// `t` (Dashboard, por ejemplo) ve cambiar la identidad de su callback en cada
// render y vuelve a disparar la carga, dejando la página en un bucle de
// fetching donde el encabezado casi nunca llega a montarse.
vi.mock('react-i18next', () => {
    const map = {
        'dashboard.titulo': 'Resumen financiero',
        'dashboard.subtitulo': 'Consulta el estado.',
        'dashboard.ingresos': 'Ingresos',
        'dashboard.gastos': 'Gastos',
        'dashboard.ahorro': 'Ahorro',
        'dashboard.balance': 'Balance',
        'dashboard.remesas': 'Remesas',
        'dashboard.alertas': 'Alertas',
        'dashboard.metas': 'Metas',
        'dashboard.movimientosRecientes': 'Movimientos recientes',
        'dashboard.todoHistorial': 'Todo el historial',
        'family.noFamilyBanner': 'Aún no tienes una familia. Puedes usar la app y crear o unirte cuando quieras.',
        'family.noFamilyBannerCta': 'Crear o unirme a una familia',
        'nav.inicio': 'Inicio',
        'nav.movimientos': 'Movimientos',
        'nav.categorias': 'Categorías',
        'nav.remesas': 'Remesas',
        'nav.ingresos': 'Ingresos',
        'nav.gastos': 'Gastos',
        'nav.presupuestos': 'Presupuestos',
        'nav.ahorro': 'Ahorro',
        'nav.educacion': 'Educación Financiera',
        'nav.familia': 'Mi Familia',
        'nav.perfil': 'Mi perfil',
        // Títulos nivel 1 que RUTAS espera encontrar por heading: sin estas
        // claves el mock devuelve la key cruda (p.ej. "remittance.title") y
        // findByRole agota el timeout buscando el título real de la página.
        'remittance.title': 'Remesas',
        'remesas.titulo': 'Remesas',
        'education.title': 'Educación Financiera',
        'profile.title': 'Mi perfil',
        'common.editar': 'Editar',
        'common.crear': 'Crear',
        'common.guardar': 'Guardar',
        'common.cancelar': 'Cancelar',
        'common.cargando': 'Cargando...',
    }

    const t = (key) => map[key] || key

    // i18n.on/off los necesita MiPerfil al suscribirse a languageChanged.
    const i18n = {
        language: 'es',
        resolvedLanguage: 'es',
        changeLanguage: () => {},
        on: () => {},
        off: () => {},
    }

    return {
        useTranslation: () => ({ t, i18n }),
    }
})

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
    { ruta: '/movimientos', titulo: /Movimientos/i },
    { ruta: '/categorias', titulo: /^Categor/i },
    { ruta: '/remesas', titulo: /^Remesas$/i },
    { ruta: '/ingresos', titulo: /^Ingresos$/i },
    { ruta: '/gastos', titulo: /^Gastos$/i },
    { ruta: '/presupuestos', titulo: /^Presupuestos$/i },
    { ruta: '/educacion-financiera', titulo: /Educaci/i },
    { ruta: '/perfil', titulo: /^Mi perfil$/i },
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
    // Con hogar: este smoke test cubre el camino normal (MiHogar no está en
    // RUTAS porque su propia suite lo cubre). La variante sin hogar vive en
    // el describe "Rutas sin familia".
    localStorage.setItem(
        'usuario',
        JSON.stringify({
            idUsuario: 1,
            nombre: 'Prueba',
            correo: 'prueba@remesa.test',
            rol: 'Admin',
            idHogar: 1,
        })
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
        // El timeout ampliado cubre el primer import perezoso en frio con la
        // suite completa en paralela (medido: ~1.2s en un solo worker); un
        // crash real sigue fallando igualmente.
        const encabezado = await screen.findByRole(
            'heading',
            {
                level: 1,
                name: titulo,
            },
            { timeout: 5000 }
        )

        expect(encabezado).toBeInTheDocument()

        // El Layout (y por lo tanto la navegacion del menu) debe estar vivo.
        expect(document.querySelectorAll('a[href]').length).toBeGreaterThanOrEqual(
            8
        )
    })

    it('la ruta desconocida no deja la app en blanco', async () => {
        window.history.pushState({}, '', '/ruta-que-no-existe')

        render(<App />)

        // El catch-all redirige a "/" (antes una ruta desconocida dejaba la
        // app en blanco): se verifica que la navegacion siga montada.
        expect(document.querySelectorAll('a[href]').length).toBeGreaterThanOrEqual(
            8
        )
    })
})

describe('Rutas sin familia', () => {
    beforeEach(() => {
        // Cuenta autenticada con idHogar null: el router se monta igual
        // (no hay muro), la app sigue navegable y el Layout muestra el
        // banner de cuenta sin familia que enlaza a /hogar.
        localStorage.setItem(
            'usuario',
            JSON.stringify({
                idUsuario: 1,
                nombre: 'Prueba',
                correo: 'prueba@remesa.test',
                rol: null,
                idHogar: null,
            })
        )
    })

    it('renderiza el dashboard con el banner de cuenta sin familia', async () => {
        window.history.pushState({}, '', '/')

        render(<App />)

        // El Dashboard y el Layout se montan sin exigir crear una familia.
        // Timeout ampliado por el primer import perezoso en frio.
        const encabezado = await screen.findByRole(
            'heading',
            { level: 1, name: /Resumen financiero/i },
            { timeout: 15000 }
        )
        expect(encabezado).toBeInTheDocument()

        // Banner no bloqueante (role=status) con el acceso al flujo de
        // creación/búsqueda de familia.
        const aviso = screen.getByText(
            'Aún no tienes una familia. Puedes usar la app y crear o unirte cuando quieras.'
        )
        expect(aviso.closest('[role="status"]')).not.toBeNull()

        const cta = screen.getByRole('link', { name: 'Crear o unirme a una familia' })
        expect(cta).toHaveAttribute('href', '/hogar')

        // La navegación general sigue viva.
        expect(document.querySelectorAll('a[href]').length).toBeGreaterThanOrEqual(
            8
        )

        // Sin hogar no se llama a GET /Hogares (responde 404 sin cuerpo).
        expect(
            fetchMock.mock.calls.some(([url]) => String(url).includes('/Hogares'))
        ).toBe(false)
    })

    it('no repite el banner de cuenta sin familia dentro de /hogar', async () => {
        window.history.pushState({}, '', '/hogar')

        render(<App />)

        // /hogar ES el flujo de creación/búsqueda de familia: el aviso del
        // Layout repetiría la misma promesa justo encima del formulario.
        const encabezado = await screen.findByRole(
            'heading',
            { level: 1, name: 'RemesaSmart SV' },
            { timeout: 15000 }
        )
        expect(encabezado).toBeInTheDocument()

        expect(
            screen.queryByText(
                'Aún no tienes una familia. Puedes usar la app y crear o unirte cuando quieras.'
            )
        ).not.toBeInTheDocument()

        // El Layout sigue montado (menú y navegación): lo que se oculta es
        // SOLO el banner, no la estructura de la app.
        expect(document.querySelectorAll('a[href]').length).toBeGreaterThanOrEqual(
            8
        )
    })

    it.each(['/categorias', '/ahorro'])(
        '%s muestra su estado vacío en lugar de un error',
        async (ruta) => {
            window.history.pushState({}, '', ruta)

            render(<App />)

            // Los GET de listado filtran por idHogar = 0 y devuelven lista
            // vacía: la página debe montar su estado vacío normal. Si
            // apareciera un Notification de error (role=alert) o el layout
            // desmontara, el test falla.
            const main = await screen.findByRole('main', {}, { timeout: 15000 })
            expect(main).toBeInTheDocument()
            expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        }
    )
})
