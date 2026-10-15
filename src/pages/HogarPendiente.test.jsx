import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import HogarPendiente from './HogarPendiente'

// Mock con referencia estable de `t` (ver por qué en MiHogar.test.jsx).
vi.mock('react-i18next', () => {
    const map = {
        'pendingHome.invited': 'Te invitaron a una familia',
        'pendingHome.invitationHint': 'Puedes aceptar la invitación o crear tu propia familia.',
        'pendingHome.sentToEmail': 'Invitación enviada a tu correo.',
        'pendingHome.createTitle': 'Crea tu familia',
        'pendingHome.createDescription': 'Para empezar a administrar las finanzas de tu hogar, crea primero tu familia.',
        'pendingHome.name': 'Nombre familiar',
        'pendingHome.namePlaceholder': 'Ej. Familia Duarte',
        'pendingHome.nameRequired': 'Completa el nombre de tu familia.',
        'pendingHome.creating': 'Creando tu familia...',
        'pendingHome.create': 'Crear familia',
        'pendingHome.createError': 'No se pudo crear tu familia. Inténtalo nuevamente.',
        'pendingHome.invitationError': 'No se pudo responder la invitación.',
        'pendingHome.joinTitle': 'Únete a una familia existente',
        'pendingHome.joinDescription': '¿Te dieron el código de una familia? Búscalo y solicita unirte.',
        'pendingHome.codeLabel': 'Código de la familia',
        'pendingHome.codePlaceholder': 'RS-FAM-XXXXXXXXXXXXXXXX',
        'pendingHome.codeRequired': 'Ingresa el código de la familia.',
        'pendingHome.codeInvalid': 'El código debe empezar con RS-FAM- y tener 16 caracteres después del guion.',
        'pendingHome.search': 'Buscar familia',
        'pendingHome.familyFound': 'Familia encontrada',
        'pendingHome.joinRequest': 'Solicitar unirse',
        'pendingHome.joinSending': 'Enviando solicitud...',
        'pendingHome.joinSuccess': 'Solicitud enviada. Espera la respuesta del administrador de la familia.',
        'pendingHome.joinError': 'No se pudo enviar la solicitud.',
        'pendingHome.searchError': 'No se pudo buscar la familia.',
        'pendingHome.myRequests': 'Mis solicitudes de unión',
        'pendingHome.noRequests': 'Aún no has enviado solicitudes de unión.',
        'pendingHome.requestDate': 'Solicitada {{date}}',
        'pendingHome.cancelSuccess': 'Solicitud cancelada.',
        'pendingHome.cancelError': 'No se pudo cancelar la solicitud.',
        'pendingHome.acceptedNotice': 'Tu solicitud para unirte a una familia fue aceptada. Actualiza tu sesión para acceder a ella.',
        'pendingHome.refreshSession': 'Actualizar sesión',
        'pendingHome.refreshingSession': 'Actualizando sesión...',
        'pendingHome.refreshError': 'No se pudo actualizar la sesión.',
        'family.accepted': 'Aceptada',
        'family.rejected': 'Rechazada',
        'family.cancelled': 'Cancelada',
        'family.pending': 'Pendiente',
        'common.aceptar': 'Aceptar',
        'common.rechazar': 'Rechazar',
        'common.cancelar': 'Cancelar',
        'common.buscando': 'Buscando...',
        'common.procesando': 'Procesando...',
        'common.cerrarNotificacion': 'Cerrar notificación',
        'profile.language': 'Idioma',
        'languagePreference.syncError': 'El idioma cambió en este dispositivo, pero no se pudo guardar en el perfil.',
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

afterEach(() => {
    cleanup()
    global.fetch = fetchOriginal
    localStorage.clear()
})

// Stub de fetch por ruta para HogarPendiente: invitaciones propias,
// solicitudes de unión, búsqueda por código y acciones sobre solicitudes.
function fetchPendiente({
    invitaciones = [],
    solicitudes = [],
    familias = {},
    buscarStatus = null,
} = {}) {
    return vi.fn(async (url, opciones = {}) => {
        const destino = String(url)

        if (destino.includes('/Auth/refrescar-sesion')) {
            return respuesta({
                token: 'token-nuevo',
                idUsuario: 1,
                nombre: 'Ana',
                correo: 'ana@demo.com',
                rol: 'Miembro',
                idHogar: 42,
            })
        }

        if (destino.includes('/Hogares/buscar')) {
            if (buscarStatus) {
                return respuesta({ message: 'No se encontró una familia con ese código.' }, buscarStatus)
            }

            const codigo = new URL(destino, 'http://test').searchParams.get('codigo')
            const familia = familias[codigo]

            if (!familia) {
                return respuesta({ message: 'No se encontró una familia con ese código.' }, 404)
            }

            return respuesta({ codigoPublico: codigo, nombreFamiliar: familia })
        }

        if (destino.includes('/SolicitudesUnion/mias')) {
            return respuesta(solicitudes)
        }

        if (destino.includes('/SolicitudesUnion') && opciones.method === 'POST') {
            if (destino.includes('/cancelar')) {
                return new Response(null, { status: 204 })
            }

            return respuesta({
                idSolicitud: 10,
                codigoPublico: JSON.parse(opciones.body).codigoPublico,
                nombreFamilia: 'Familia Duarte',
                estado: 'Pendiente',
                fechaSolicitud: '2026-02-15T00:00:00Z',
                fechaRespuesta: null,
            }, 201)
        }

        if (destino.includes('/Invitaciones')) {
            return respuesta(invitaciones)
        }

        return respuesta([])
    })
}

const CODIGO_VALIDO = 'RS-FAM-ABCDEF23456789XY'

describe('HogarPendiente', () => {
    it('valida el formato del código en el cliente antes de buscar', async () => {
        const fetchMock = fetchPendiente()
        global.fetch = fetchMock

        render(<HogarPendiente onHogarCreado={() => {}} />)

        fireEvent.change(await screen.findByLabelText('Código de la familia'), {
            target: { value: 'cualquier-cosa' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Buscar familia' }))

        expect(
            await screen.findByText('El código debe empezar con RS-FAM- y tener 16 caracteres después del guion.')
        ).toBeInTheDocument()

        // No llegó a tocar el backend.
        expect(
            fetchMock.mock.calls.some(([url]) => String(url).includes('/Hogares/buscar'))
        ).toBe(false)
    })

    it('busca una familia por código y envía la solicitud de unión', async () => {
        const fetchMock = fetchPendiente({
            familias: { [CODIGO_VALIDO]: 'Familia Duarte' },
        })
        global.fetch = fetchMock

        render(<HogarPendiente onHogarCreado={() => {}} />)

        fireEvent.change(await screen.findByLabelText('Código de la familia'), {
            target: { value: CODIGO_VALIDO },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Buscar familia' }))

        expect(await screen.findByText('Familia Duarte')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Solicitar unirse' }))

        await waitFor(() =>
            expect(
                screen.getByText('Solicitud enviada. Espera la respuesta del administrador de la familia.')
            ).toBeInTheDocument()
        )

        const llamada = fetchMock.mock.calls.find(([url, opciones]) =>
            String(url).endsWith('/SolicitudesUnion') && opciones?.method === 'POST'
        )
        expect(llamada).toBeDefined()
        expect(JSON.parse(llamada[1].body).codigoPublico).toBe(CODIGO_VALIDO)
    })

    it('muestra el error del backend (404) cuando el código no existe', async () => {
        global.fetch = fetchPendiente()

        render(<HogarPendiente onHogarCreado={() => {}} />)

        fireEvent.change(await screen.findByLabelText('Código de la familia'), {
            target: { value: CODIGO_VALIDO },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Buscar familia' }))

        expect(
            await screen.findByText('No se encontró una familia con ese código.')
        ).toBeInTheDocument()
    })

    it('lista las solicitudes propias y cancela una pendiente', async () => {
        const fetchMock = fetchPendiente({
            solicitudes: [
                {
                    idSolicitud: 3,
                    codigoPublico: CODIGO_VALIDO,
                    nombreFamilia: 'Familia Duarte',
                    estado: 'Pendiente',
                    fechaSolicitud: '2026-02-10T00:00:00Z',
                    fechaRespuesta: null,
                },
                {
                    idSolicitud: 4,
                    codigoPublico: 'RS-FAM-ZZZZZZZZZZZZZZZZ',
                    nombreFamilia: 'Familia Paz',
                    estado: 'Rechazada',
                    fechaSolicitud: '2026-01-05T00:00:00Z',
                    fechaRespuesta: '2026-01-06T00:00:00Z',
                },
            ],
        })
        global.fetch = fetchMock

        render(<HogarPendiente onHogarCreado={() => {}} />)

        expect(await screen.findByText('Familia Duarte')).toBeInTheDocument()
        expect(screen.getByText('Familia Paz')).toBeInTheDocument()
        expect(screen.getByText('Pendiente')).toBeInTheDocument()
        expect(screen.getByText('Rechazada')).toBeInTheDocument()

        // Solo la pendiente ofrece cancelar.
        const botonesCancelar = screen.getAllByRole('button', { name: 'Cancelar' })
        expect(botonesCancelar).toHaveLength(1)

        fireEvent.click(botonesCancelar[0])

        await waitFor(() =>
            expect(screen.getByText('Solicitud cancelada.')).toBeInTheDocument()
        )

        const llamada = fetchMock.mock.calls.find(([url, opciones]) =>
            String(url).includes('/SolicitudesUnion/3/cancelar') && opciones?.method === 'POST'
        )
        expect(llamada).toBeDefined()
    })

    it('ofrece actualizar la sesión cuando una solicitud fue aceptada', async () => {
        const onHogarCreado = vi.fn()
        const fetchMock = fetchPendiente({
            solicitudes: [
                {
                    idSolicitud: 5,
                    codigoPublico: CODIGO_VALIDO,
                    nombreFamilia: 'Familia Duarte',
                    estado: 'Aceptada',
                    fechaSolicitud: '2026-02-01T00:00:00Z',
                    fechaRespuesta: '2026-02-02T00:00:00Z',
                },
            ],
        })
        global.fetch = fetchMock

        render(<HogarPendiente onHogarCreado={onHogarCreado} />)

        expect(
            await screen.findByText('Tu solicitud para unirte a una familia fue aceptada. Actualiza tu sesión para acceder a ella.')
        ).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Actualizar sesión' }))

        await waitFor(() =>
            expect(onHogarCreado).toHaveBeenCalledWith(
                expect.objectContaining({ token: 'token-nuevo', idHogar: 42, rol: 'Miembro' })
            )
        )

        const llamada = fetchMock.mock.calls.find(([url, opciones]) =>
            String(url).includes('/Auth/refrescar-sesion') && opciones?.method === 'POST'
        )
        expect(llamada).toBeDefined()

        // refrescarSesion persiste el LoginResponse con las claves de authApi.login.
        expect(localStorage.getItem('token')).toBe('token-nuevo')
        expect(JSON.parse(localStorage.getItem('usuario')).idHogar).toBe(42)
    })

    it('muestra el estado vacío de solicitudes', async () => {
        global.fetch = fetchPendiente()

        render(<HogarPendiente onHogarCreado={() => {}} />)

        expect(await screen.findByText('Aún no has enviado solicitudes de unión.')).toBeInTheDocument()
    })
})
