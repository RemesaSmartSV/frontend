import { describe, it, expect, afterEach, vi } from 'vitest'
import { authApi } from './api'

const fetchOriginal = global.fetch

afterEach(() => {
    global.fetch = fetchOriginal
    localStorage.clear()
    vi.unstubAllGlobals()
})

describe('authApi.register', () => {
    it('persists token and usuario in localStorage when the backend answers a token', async () => {
        const cuerpo = {
            idUsuario: 9,
            nombre: 'Ana Gomez',
            correo: 'ana@gmail.com',
            token: 'jwt-de-registro',
            rol: null,
            idHogar: null,
        }
        global.fetch = vi.fn(async () =>
            new Response(JSON.stringify(cuerpo), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        )

        const resultado = await authApi.register({
            nombre: 'Ana Gomez',
            correo: 'ana@gmail.com',
            contrasena: 'claveSegura1',
            confirmarContrasena: 'claveSegura1',
        })

        expect(localStorage.getItem('token')).toBe('jwt-de-registro')
        expect(JSON.parse(localStorage.getItem('usuario'))).toEqual(cuerpo)
        expect(resultado).toEqual(cuerpo)
    })
})
