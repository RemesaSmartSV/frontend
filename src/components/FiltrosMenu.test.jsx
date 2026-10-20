import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import FiltrosMenu from './FiltrosMenu'

// El mapa replica las claves reales de src/i18n/es.json y vive DENTRO de la
// factory del mock: `vi.mock` se eleva (hoisting) por encima de los imports,
// así que cualquier constante declarada fuera del factory estaría aún sin
// inicializar cuando el mock se construye (ReferenceError). Patrón de
// Dashboard.periodos.test.jsx / App.accesibilidad.test.jsx.
vi.mock('react-i18next', () => {
    const map = {
        'filtros.titulo': 'Filtros',
        'filtros.conContador': 'Filtros ({{cantidad}} activos)',
        'common.limpiarFiltros': 'Limpiar filtros',
    }

    return {
        useTranslation: () => ({
            t: (clave, opciones) =>
                (map[clave] ?? clave).replace(
                    /\{\{(\w+)\}\}/g,
                    (marca, variable) =>
                        opciones && opciones[variable] !== undefined
                            ? String(opciones[variable])
                            : marca
                ),
            i18n: { changeLanguage: () => {} },
        }),
    }
})

// El panel se localiza por el MISMO id que el botón declara en
// aria-controls: así el test comprueba la conexión declarativa en lugar de
// adivinar un selector.
function panelDe(boton) {
    return document.getElementById(boton.getAttribute('aria-controls'))
}

function oculto(panel) {
    return panel.classList.contains('hidden')
}

// R2: los controles llegan como children del padre y tienen que seguir
// montados en el DOM aunque el panel esté cerrado.
function controles() {
    return (
        <>
            <label htmlFor="fechaDesde">Fecha desde</label>
            <input id="fechaDesde" name="fechaDesde" defaultValue="" />
        </>
    )
}

afterEach(() => cleanup())

describe('FiltrosMenu — apertura y estado accesible', () => {
    it('arranca cerrado con aria-expanded/aria-controls correctos y los controles montados', () => {
        render(<FiltrosMenu>{controles()}</FiltrosMenu>)

        const boton = screen.getByRole('button', { name: 'Filtros' })
        const panel = panelDe(boton)

        expect(boton).toHaveAttribute('aria-expanded', 'false')
        expect(boton.getAttribute('aria-controls')).toBe(panel.id)
        expect(oculto(panel)).toBe(true)

        // El panel existe y trae sus controles aunque esté cerrado.
        expect(panel).toBeInTheDocument()
        expect(document.getElementById('fechaDesde')).toBeInTheDocument()
    })

    it('abre y cierra con el botón, y el panel oculta/muestra por clase sin desmontarse', () => {
        render(<FiltrosMenu>{controles()}</FiltrosMenu>)

        const boton = screen.getByRole('button', { name: 'Filtros' })
        const panel = panelDe(boton)

        fireEvent.click(boton)

        expect(boton).toHaveAttribute('aria-expanded', 'true')
        expect(oculto(panel)).toBe(false)

        fireEvent.click(boton)

        expect(boton).toHaveAttribute('aria-expanded', 'false')
        expect(oculto(panel)).toBe(true)

        // Cerrar no desmonta los controles: los ids siguen resolviéndose.
        expect(document.getElementById('fechaDesde')).toBeInTheDocument()
    })
})

describe('FiltrosMenu — badge de filtros activos', () => {
    it('no muestra badge con 0 activos (ni con la prop omitida)', () => {
        const { unmount } = render(
            <FiltrosMenu cantidadActivos={0}>{controles()}</FiltrosMenu>
        )

        expect(
            screen.getByRole('button', { name: 'Filtros' })
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: /activos/ })
        ).not.toBeInTheDocument()

        unmount()

        // Prop opcional: sin cantidadActivos el botón se llama sólo "Filtros".
        render(<FiltrosMenu>{controles()}</FiltrosMenu>)

        expect(
            screen.getByRole('button', { name: 'Filtros' })
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: /activos/ })
        ).not.toBeInTheDocument()
    })

    it('muestra el número y anuncia la cantidad en el aria-label con 1 o más activos', () => {
        render(
            <FiltrosMenu cantidadActivos={3}>{controles()}</FiltrosMenu>
        )

        const boton = screen.getByRole('button', {
            name: 'Filtros (3 activos)',
        })

        expect(boton).toHaveTextContent('3')
        expect(boton).toHaveAttribute('aria-expanded', 'false')
        // El badge es el <span> decorativo (aria-hidden); el icono también lo
        // es, por eso se acota a los span.
        expect(
            boton.querySelector('span[aria-hidden="true"]')
        ).not.toBeNull()
    })
})

describe('FiltrosMenu — cierre', () => {
    it('cierra con click fuera del contenedor y NO con click dentro del panel', () => {
        render(<FiltrosMenu>{controles()}</FiltrosMenu>)

        const boton = screen.getByRole('button', { name: 'Filtros' })
        const panel = panelDe(boton)

        fireEvent.click(boton)
        expect(boton).toHaveAttribute('aria-expanded', 'true')

        // Un click dentro del panel (en un control) no lo cierra.
        fireEvent.mouseDown(document.getElementById('fechaDesde'))
        expect(boton).toHaveAttribute('aria-expanded', 'true')

        // Un mousedown fuera del contenedor sí lo cierra.
        fireEvent.mouseDown(document.body)
        expect(boton).toHaveAttribute('aria-expanded', 'false')
        expect(oculto(panel)).toBe(true)
    })

    it('Escape cierra el panel y devuelve el foco al botón', () => {
        render(<FiltrosMenu>{controles()}</FiltrosMenu>)

        const boton = screen.getByRole('button', { name: 'Filtros' })
        const panel = panelDe(boton)

        fireEvent.click(boton)
        boton.focus()

        fireEvent.keyDown(document, { key: 'Escape' })

        expect(boton).toHaveAttribute('aria-expanded', 'false')
        expect(oculto(panel)).toBe(true)
        expect(document.activeElement).toBe(boton)
    })
})

describe('FiltrosMenu — limpiar', () => {
    it('pinta el botón "Limpiar filtros" dentro del panel sólo si recibe onLimpiar', () => {
        const onLimpiar = vi.fn()
        const { unmount } = render(
            <FiltrosMenu>{controles()}</FiltrosMenu>
        )

        expect(
            screen.queryByRole('button', { name: 'Limpiar filtros' })
        ).not.toBeInTheDocument()

        unmount()

        render(
            <FiltrosMenu cantidadActivos={2} onLimpiar={onLimpiar}>
                {controles()}
            </FiltrosMenu>
        )

        fireEvent.click(
            screen.getByRole('button', { name: 'Filtros (2 activos)' })
        )

        fireEvent.click(
            screen.getByRole('button', { name: 'Limpiar filtros' })
        )

        expect(onLimpiar).toHaveBeenCalledTimes(1)
    })
})
