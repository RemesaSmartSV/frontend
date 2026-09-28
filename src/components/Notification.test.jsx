import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import Notification from './Notification'

afterEach(() => {
    vi.useRealTimers()
})

describe('Notification', () => {
    it('no renderiza nada si no hay mensaje', () => {
        render(
            <Notification tipo="success" mensaje="" onClose={vi.fn()} />
        )

        expect(screen.queryByRole('alert')).toBeNull()
    })

    it('muestra el mensaje cuando existe', () => {
        render(
            <Notification
                tipo="success"
                mensaje="Movimiento registrado"
                onClose={vi.fn()}
            />
        )

        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(
            screen.getByText('Movimiento registrado')
        ).toBeInTheDocument()
    })

    // El hook useEffect debe ejecutarse siempre, este es el regression test
    // del bug de Rules of Hooks: antes el `return null` estaba antes del
    // useEffect, asi que la cantidad de hooks cambiaba entre renders.
    it('cambia entre mensaje y vacio sin crashear (regresion Rules of Hooks)', () => {
        const onClose = vi.fn()
        const { rerender } = render(
            <Notification tipo="error" mensaje="" onClose={onClose} />
        )

        expect(screen.queryByRole('alert')).toBeNull()

        expect(() => {
            rerender(
                <Notification
                    tipo="error"
                    mensaje="Error"
                    onClose={onClose}
                />
            )
            rerender(
                <Notification
                    tipo="error"
                    mensaje=""
                    onClose={onClose}
                />
            )
        }).not.toThrow()
    })

    it('el boton de cerrar llama a onClose', () => {
        const onClose = vi.fn()

        render(
            <Notification
                tipo="error"
                mensaje="Error"
                onClose={onClose}
            />
        )

        screen.getByLabelText('Cerrar notificación').click()

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('las de tipo success se autodesvanan a los 4 s', () => {
        vi.useFakeTimers()
        const onClose = vi.fn()

        render(
            <Notification
                tipo="success"
                mensaje="Guardado"
                onClose={onClose}
            />
        )

        expect(onClose).not.toHaveBeenCalled()

        act(() => {
            vi.advanceTimersByTime(4000)
        })

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('las de tipo error NO se autodesvanan', () => {
        vi.useFakeTimers()
        const onClose = vi.fn()

        render(
            <Notification
                tipo="error"
                mensaje="Error"
                onClose={onClose}
            />
        )

        act(() => {
            vi.advanceTimersByTime(10000)
        })

        expect(onClose).not.toHaveBeenCalled()
    })
})
