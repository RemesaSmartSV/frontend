import { describe, it, expect, afterEach } from 'vitest'
import { obtenerFechaHoy, parsearFechaLocal } from './formato'

const RealDate = Date

// Fija el reloj a una hora local concreta. Necesario porque el bug era
// precisamente una confusion entre UTC y hora local: sin fijar la hora
// del dia el test pasaria igual en UTC.
function fijarRelojLocal(anio, mes, dia, hora, minuto) {
    const fijo = new RealDate(anio, mes, dia, hora, minuto, 0, 0)

    class DateFalso extends RealDate {
        constructor(...args) {
            if (args.length === 0) {
                super(fijo.getTime())
            } else {
                super(...args)
            }
        }

        static now() {
            return fijo.getTime()
        }
    }

    globalThis.Date = DateFalso
}

afterEach(() => {
    globalThis.Date = RealDate
})

describe('obtenerFechaHoy', () => {
    it('devuelve la fecha local, no la de UTC', () => {
        // 19:30 en UTC-6 ya es el dia siguiente en UTC: toISOString()
        // devolvia 2026-09-27 cuando la fecha local es 2026-09-26.
        fijarRelojLocal(2026, 8, 26, 19, 30)

        expect(obtenerFechaHoy()).toBe('2026-09-26')
    })

    it('no adelanta el dia en la madrugada', () => {
        fijarRelojLocal(2026, 8, 27, 0, 30)

        expect(obtenerFechaHoy()).toBe('2026-09-27')
    })

    it('es correcta en el limite del dia', () => {
        fijarRelojLocal(2026, 8, 26, 23, 59)

        expect(obtenerFechaHoy()).toBe('2026-09-26')
    })

    it('devuelve formato YYYY-MM-DD con ceros a la izquierda', () => {
        fijarRelojLocal(2026, 0, 5, 12, 0)

        expect(obtenerFechaHoy()).toBe('2026-01-05')
    })
})

describe('parsearFechaLocal', () => {
    it('no desplaza el dia 1 de mes al mes anterior', () => {
        // El backend manda date-only. new Date('2026-09-01') se parsea como
        // UTC midnight; con getters locales en UTC-6 caia en agosto.
        const fecha = parsearFechaLocal('2026-09-01')

        expect(fecha.getFullYear()).toBe(2026)
        expect(fecha.getMonth()).toBe(8)
        expect(fecha.getDate()).toBe(1)
    })

    it('acepta un timestamp completo', () => {
        const fecha = parsearFechaLocal('2026-09-26T14:30:00Z')

        expect(fecha.getFullYear()).toBe(2026)
        expect(fecha.getMonth()).toBe(8)
        expect(fecha.getDate()).toBe(26)
    })

    it('devuelve null con valores no validos', () => {
        expect(parsearFechaLocal(null)).toBeNull()
        expect(parsearFechaLocal(undefined)).toBeNull()
        expect(parsearFechaLocal('')).toBeNull()
        expect(parsearFechaLocal('no-es-fecha')).toBeNull()
    })
})
