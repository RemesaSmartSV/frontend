import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import LeyendaOrdenada from './LeyendaOrdenada'

// Payload con la MISMA forma que le pasa recharts, pero desordenado a
// propósito: es lo que produce el orden alfabético por name en español
// (Ahorro, Gastos, Ingresos) antes de este componente.
const PAYLOAD_DESATORDENADO = [
    { dataKey: 'ahorro', value: 'Ahorro', color: '#f59e0b' },
    { dataKey: 'gastos', value: 'Gastos', color: '#dc2626' },
    { dataKey: 'ingresos', value: 'Ingresos', color: '#16a34a' },
]

describe('LeyendaOrdenada', () => {
    afterEach(cleanup)

    it('devuelve siempre ingreso, ahorro y gasto, sin importar el orden de entrada', () => {
        render(<LeyendaOrdenada payload={PAYLOAD_DESATORDENADO} />)

        const textos = screen
            .getAllByRole('listitem')
            .map((li) => li.textContent.trim())

        expect(textos).toEqual(['Ingresos', 'Ahorro', 'Gastos'])
    })

    it('respeta el color de cada serie', () => {
        const { container } = render(
            <LeyendaOrdenada payload={PAYLOAD_DESATORDENADO} />
        )

        const puntos = [
            ...container.querySelectorAll('li span'),
        ].map((s) => s.style.backgroundColor)

        // jsdom normaliza los hex a rgb()
        expect(puntos).toEqual([
            'rgb(22, 163, 74)',
            'rgb(245, 158, 11)',
            'rgb(220, 38, 38)',
        ])

    })

    it('no rompe si el payload viene vacío', () => {
        const { container } = render(
            <LeyendaOrdenada payload={[]} />
        )

        expect(container.innerHTML).toBe('')
    })

    it('no revienta con una serie sin dataKey y la manda al final', () => {
        render(
            <LeyendaOrdenada
                payload={[
                    { dataKey: 'gastos', value: 'Gastos', color: '#dc2626' },
                    { value: 'Sin dataKey', color: '#0891b2' },
                ]}
            />
        )

        const textos = screen
            .getAllByRole('listitem')
            .map((li) => li.textContent.trim())

        expect(textos).toEqual(['Gastos', 'Sin dataKey'])
    })
})
