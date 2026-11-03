import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import EducacionFinanciera from './EducacionFinanciera'

// Mock con referencia estable de `t` (ver por qué en App.routes.test.jsx):
// un `t` nuevo por render cambiaría la identidad de cargarTips (useCallback)
// y re-dispararía el effect en bucle.
vi.mock('react-i18next', () => {
    const map = {
        'education.title': 'Educación Financiera',
        'education.tips': 'Consejos financieros',
        'education.loading': 'Cargando consejos financieros...',
        'education.loadError': 'No se pudieron cargar los consejos financieros.',
        'education.updated': 'Consejos financieros actualizados correctamente.',
        'education.retry': 'Intentar nuevamente',
        'education.tip': 'Consejo',
        'education.aiBadge': 'IA',
        'education.aiTitle':
            'Consejos generados por inteligencia artificial; se actualizan cada 2 horas.',
        'common.actualizar': 'Actualizar',
        'common.procesando': 'Procesando...',
    }

    const t = (key) => map[key] || key

    return {
        useTranslation: () => ({
            t,
            i18n: { changeLanguage: () => {}, resolvedLanguage: 'es', language: 'es' },
        }),
    }
})

const fetchOriginal = global.fetch

function respuesta(cuerpo, status = 200) {
    return new Response(JSON.stringify(cuerpo), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

const TIP_IA = {
    titulo: 'Consejo generado por IA',
    contenido: 'Diversifica tus ahorros cada mes.',
}

const TIP_DB = {
    idTip: 1,
    titulo: 'Consejo de la base de datos',
    contenido: 'Lleva un registro de tus gastos.',
}

// Stub de fetch por ruta. `consejos` controla GET /api/ConsejosIa:
//   - Error lanzado  -> la promesa rechaza (fallo de red)
//   - status != 200   -> non-2xx (manejarRespuesta lanza)
//   - array           -> respuesta exitosa
// `tipsStatus` aplica lo mismo al fallback de la DB.
function crearFetch({
    consejos = [],
    consejosStatus = 200,
    tips = [],
    tipsStatus = 200,
} = {}) {
    return vi.fn(async (url) => {
        const destino = String(url)

        if (destino.includes('/ConsejosIa')) {
            if (consejos instanceof Error) {
                throw consejos
            }

            if (consejosStatus !== 200) {
                return respuesta({ message: 'Groq no disponible' }, consejosStatus)
            }

            return respuesta(consejos)
        }

        if (destino.includes('/TipsFinancieros')) {
            if (tipsStatus !== 200) {
                return respuesta(
                    { message: 'Base de datos no disponible' },
                    tipsStatus
                )
            }

            return respuesta(tips)
        }

        return respuesta([])
    })
}

function llamadasA(fetchMock, ruta) {
    return fetchMock.mock.calls.filter(([url]) => String(url).includes(ruta))
}

afterEach(() => {
    cleanup()
    global.fetch = fetchOriginal
    localStorage.clear()
})

describe('EducacionFinanciera — consejos IA con fallback a la DB', () => {
    it('muestra los consejos de IA y el chip "IA" cuando el endpoint responde un array', async () => {
        const fetchMock = crearFetch({ consejos: [TIP_IA], tips: [TIP_DB] })
        global.fetch = fetchMock

        const { unmount } = render(<EducacionFinanciera />)

        expect(
            await screen.findByText('Consejo generado por IA')
        ).toBeInTheDocument()

        // El chip de origen explica el tooltip de rotación por 2h.
        const chip = screen.getByText('IA')
        expect(chip).toHaveAttribute(
            'title',
            'Consejos generados por inteligencia artificial; se actualizan cada 2 horas.'
        )

        // Con IA disponible nunca se tocó el fallback de la DB.
        expect(llamadasA(fetchMock, '/TipsFinancieros')).toHaveLength(0)

        // El desmontar limpia el intervalo de 2h sin crashear.
        unmount()
    })

    it('cae a los tips de la DB cuando el endpoint de IA responde 500, sin chip "IA"', async () => {
        const fetchMock = crearFetch({
            consejos: [],
            consejosStatus: 500,
            tips: [TIP_DB],
        })
        global.fetch = fetchMock

        render(<EducacionFinanciera />)

        expect(
            await screen.findByText('Consejo de la base de datos')
        ).toBeInTheDocument()

        // Fallback completado: sin indicador de IA y sin error visible.
        expect(screen.queryByText('IA')).not.toBeInTheDocument()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(llamadasA(fetchMock, '/ConsejosIa')).toHaveLength(1)
        expect(llamadasA(fetchMock, '/TipsFinancieros')).toHaveLength(1)
    })

    it('el botón "Actualizar" reconsulta los consejos y muestra el toast de éxito', async () => {
        const fetchMock = crearFetch({ consejos: [TIP_IA] })
        global.fetch = fetchMock

        render(<EducacionFinanciera />)

        expect(
            await screen.findByText('Consejo generado por IA')
        ).toBeInTheDocument()
        expect(llamadasA(fetchMock, '/ConsejosIa')).toHaveLength(1)

        fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }))

        await waitFor(() =>
            expect(llamadasA(fetchMock, '/ConsejosIa')).toHaveLength(2)
        )

        expect(
            await screen.findByText(
                'Consejos financieros actualizados correctamente.'
            )
        ).toBeInTheDocument()
    })

    it('muestra el estado de error cuando fallan la IA y la DB a la vez', async () => {
        // Red caída en IA (rechazo) + non-2xx en la DB: ambos caminos de
        // fallo en un solo caso, sin unhandled rejection.
        const fetchMock = crearFetch({
            consejos: new TypeError('Failed to fetch'),
            tips: [],
            tipsStatus: 500,
        })
        global.fetch = fetchMock

        render(<EducacionFinanciera />)

        expect(
            await screen.findByRole(
                'heading',
                { name: 'No se pudieron cargar los consejos financieros.' },
                { timeout: 5000 }
            )
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', { name: 'Intentar nuevamente' })
        ).toBeInTheDocument()

        expect(screen.queryByText('IA')).not.toBeInTheDocument()
        expect(llamadasA(fetchMock, '/ConsejosIa')).toHaveLength(1)
        expect(llamadasA(fetchMock, '/TipsFinancieros')).toHaveLength(1)
    })
})
