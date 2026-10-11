import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react'
import Ahorro from './Ahorro'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => {
            const map = {
                'ahorro.titulo': 'Ahorro',
                'ahorro.subtitulo': 'Crea metas de ahorro, registra aportes y sigue tu progreso.',
                'ahorro.totalAhorrado': 'Total ahorrado',
                'ahorro.totalObjetivo': 'Total objetivo',
                'ahorro.progresoGlobal': 'Progreso global',
                'ahorro.crearMeta': 'Crear meta de ahorro',
                'ahorro.editarMeta': 'Editar meta',
                'ahorro.tituloMeta': 'Título',
                'ahorro.montoObjetivo': 'Monto objetivo',
                'ahorro.fechaObjetivo': 'Fecha objetivo',
                'ahorro.registrarAporte': 'Registrar aporte',
                'ahorro.sinMetas': 'Sin metas de ahorro',
                'common.cargando': 'Cargando...',
            }
            return map[key] || key
        },
        i18n: { changeLanguage: () => {} },
    }),
}))

// La página consume ahorroApi (MetasAhorro + Aportes). Se stubbea global.fetch
// igual que en el resto de la suite.

const fetchOriginal = global.fetch

function respuesta(cuerpo, status = 200) {
    return new Response(JSON.stringify(cuerpo), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

function fetchAhorro(paginas) {
    return vi.fn(async (url, opciones = {}) => {
        const destino = String(url)

        if (destino.includes('/MetasAhorro')) {
            if (opciones.method === 'POST') {
                const datos = JSON.parse(opciones.body)
                return respuesta(
                    {
                        idMeta: 99,
                        ...datos,
                        montoActual: 0,
                        estado: 'En progreso',
                    },
                    201
                )
            }

            return respuesta(paginas)
        }

        if (destino.includes('/Aportes')) return respuesta([])

        return respuesta([])
    })
}

afterEach(() => {
    cleanup()
    global.fetch = fetchOriginal
    localStorage.clear()
})

describe('Ahorro', () => {
    it('renderiza metas con progreso, estado y montos', async () => {
        global.fetch = fetchAhorro({
            items: [
                {
                    idMeta: 1,
                    titulo: 'Fondo de emergencia',
                    montoObjetivo: 500,
                    montoActual: 250,
                    fechaLimite: '2027-06-30T00:00:00Z',
                    estado: 'En progreso',
                },
            ],
            totalPages: 1,
        })

        render(<Ahorro />)

        expect(
            await screen.findByText('Fondo de emergencia')
        ).toBeInTheDocument()

        // "50%" aparece dos veces: la tarjeta de meta y el progreso global.
        expect((await screen.findAllByText('50%')).length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText(/Restan \$250\.00/)).toBeInTheDocument()
        // "$500.00" aparece dos veces: la tarjeta de meta y la de Total objetivo.
        expect(screen.getAllByText('$500.00').length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('En progreso')).toBeInTheDocument()
    })

    it('muestra el estado vacío cuando no hay metas', async () => {
        global.fetch = fetchAhorro({ items: [], totalPages: 1 })

        render(<Ahorro />)

        expect(
            await screen.findByText('Sin metas de ahorro')
        ).toBeInTheDocument()
    })

    it('crea una meta nueva y muestra el mensaje de éxito', async () => {
        global.fetch = vi.fn(async (url, opciones = {}) => {
            const destino = String(url)

            if (destino.includes('/MetasAhorro')) {
                if (opciones.method === 'POST') {
                    const datos = JSON.parse(opciones.body)
                    expect(datos.titulo).toBe('Vacaciones')
                    expect(datos.montoObjetivo).toBe(1000)
                    expect(datos.fechaLimite).toContain('2027-')
                    return respuesta(
                        {
                            idMeta: 2,
                            ...datos,
                            montoActual: 0,
                            estado: 'En progreso',
                        },
                        201
                    )
                }

                // listado inicial: vacío; tras crear: con la meta nueva
                return respuesta({ items: [], totalPages: 1 })
            }

            return respuesta([])
        })

        render(<Ahorro />)

        await screen.findByText('Sin metas de ahorro')

        fireEvent.change(screen.getByLabelText('T\u00edtulo'), {
            target: { value: 'Vacaciones' },
        })
        fireEvent.change(screen.getByLabelText('Monto objetivo'), {
            target: { value: '1000' },
        })
        fireEvent.change(screen.getByLabelText('Fecha objetivo'), {
            target: { value: '2027-12-01' },
        })
        fireEvent.click(
            screen.getByRole('button', { name: 'Crear meta' })
        )

        await waitFor(() =>
            expect(
                screen.getByText('Meta creada correctamente.')
            ).toBeInTheDocument()
        )
    })

    it('valida el monto objetivo antes de enviar', async () => {
        global.fetch = fetchAhorro({ items: [], totalPages: 1 })

        render(<Ahorro />)

        await screen.findByText('Sin metas de ahorro')

        fireEvent.change(screen.getByLabelText('T\u00edtulo'), {
            target: { value: 'Meta' },
        })
        fireEvent.click(
            screen.getByRole('button', { name: 'Crear meta' })
        )

        expect(
            await screen.findByText('El monto objetivo debe ser mayor que 0.')
        ).toBeInTheDocument()
    })
})
