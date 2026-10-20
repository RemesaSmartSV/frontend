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
        'pendingHome.createDescription': 'Crea tu familia para administrar las finanzas de tu hogar, o únete a una existente cuando quieras.',
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
        'pendingHome.codePlaceholder': '123456',
        'pendingHome.codeRequired': 'Ingresa el código de la familia.',
        'pendingHome.codeInvalid': 'Ingresa el código de 6 dígitos de tu familia.',
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
        'pendingHome.acceptedNotice': '¡Tu solicitud fue aceptada! Ya eres parte de la familia; actualiza tu sesión para verla.',
        'pendingHome.refreshSession': 'Actualizar sesión',
        'pendingHome.refreshingSession': 'Actualizando sesión...',
        'pendingHome.refreshError': 'No se pudo actualizar la sesión.',
        'family.accepted': 'Aceptada',
        'family.rejected': 'Rechazada',
        'family.cancelled': 'Cancelada',
        'family.pending': 'Pendiente',
        'family.skipForNow': 'Ahora no, usar la app',
        'family.skipHint': 'Más tarde puedes crear o unirte a una familia desde Mi familia.',
        'family.searchByNameTitle': 'Buscar familia por nombre',
        'family.searchByNameHint': 'Escribe al menos 3 caracteres. Podrás solicitar unirte y el administrador de la familia aprobará o rechazará la solicitud.',
        'family.searchByNameLabel': 'Nombre de la familia',
        'family.searchByNamePlaceholder': 'Ej. Familia Duarte',
        'family.searchByNameMin': 'Ingresa al menos 3 caracteres para buscar.',
        'family.searchByNameSearch': 'Buscar por nombre',
        'family.searchByNameEmpty': 'No se encontraron familias con ese nombre.',
        'family.searchByNameError': 'No se pudo buscar por nombre.',
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
// solicitudes de unión, búsqueda por código, búsqueda por nombre y acciones
// sobre solicitudes.
function fetchPendiente({
    invitaciones = [],
    solicitudes = [],
    familias = {},
    buscarStatus = null,
    coincidencias = [],
    solicitudStatus = null,
    solicitudMessage = '',
    refrescarStatus = null,
} = {}) {
    return vi.fn(async (url, opciones = {}) => {
        const destino = String(url)

        if (destino.includes('/Auth/refrescar-sesion')) {
            if (refrescarStatus) {
                return respuesta(
                    { message: 'No se pudo actualizar la sesión.' },
                    refrescarStatus
                )
            }

            return respuesta({
                token: 'token-nuevo',
                idUsuario: 1,
                nombre: 'Ana',
                correo: 'ana@demo.com',
                rol: 'Miembro',
                idHogar: 42,
            })
        }

        // Va ANTES que /Hogares/buscar: la ruta por nombre también contiene
        // ese fragmento y el stub tendría que responder como búsqueda por
        // código. Reproduce las reglas del backend (mínimo 3 caracteres).
        if (destino.includes('/Hogares/buscar-por-nombre')) {
            const q = new URL(destino, 'http://test').searchParams.get('q') || ''

            if (q.trim().length < 3) {
                return respuesta({ message: 'La búsqueda debe tener al menos 3 caracteres.' }, 400)
            }

            // El endpoint nunca incluye CodigoPublico.
            return respuesta(coincidencias)
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

            if (solicitudStatus) {
                return respuesta({ message: solicitudMessage }, solicitudStatus)
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
const CODIGO_DIGITOS = '048293'

// Solicitud cuya aprobación deja al usuario SIN idHogar en el token viejo:
// es el caso que dispara el refresco de sesión (T14).
const SOLICITUD_ACEPTADA = {
    idSolicitud: 5,
    codigoPublico: CODIGO_VALIDO,
    nombreFamilia: 'Familia Duarte',
    estado: 'Aceptada',
    fechaSolicitud: '2026-02-01T00:00:00Z',
    fechaRespuesta: '2026-02-02T00:00:00Z',
}

const AVISO_ACEPTADA =
    '¡Tu solicitud fue aceptada! Ya eres parte de la familia; actualiza tu sesión para verla.'

// POST /Auth/refrescar-sesion registrados por el stub.
function intentosDeRefresco(fetchMock) {
    return fetchMock.mock.calls.filter(
        ([url, opciones]) =>
            String(url).includes('/Auth/refrescar-sesion') &&
            opciones?.method === 'POST'
    )
}

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
            await screen.findByText('Ingresa el código de 6 dígitos de tu familia.')
        ).toBeInTheDocument()

        // No llegó a tocar el backend.
        expect(
            fetchMock.mock.calls.some(([url]) => String(url).includes('/Hogares/buscar'))
        ).toBe(false)
    })

    it('acepta el código de 6 dígitos del formato vigente y busca sin error de formato', async () => {
        const fetchMock = fetchPendiente({
            familias: { [CODIGO_DIGITOS]: 'Familia Duarte' },
        })
        global.fetch = fetchMock

        render(<HogarPendiente onHogarCreado={() => {}} />)

        fireEvent.change(await screen.findByLabelText('Código de la familia'), {
            target: { value: CODIGO_DIGITOS },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Buscar familia' }))

        expect(await screen.findByText('Familia Duarte')).toBeInTheDocument()

        // Pasó la validación de formato: jamás se mostró el error de código.
        expect(
            screen.queryByText('Ingresa el código de 6 dígitos de tu familia.')
        ).not.toBeInTheDocument()
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

    it('refresca la sesión solo, al montar, cuando una solicitud fue aceptada', async () => {
        const onHogarCreado = vi.fn()
        const fetchMock = fetchPendiente({
            solicitudes: [SOLICITUD_ACEPTADA],
        })
        global.fetch = fetchMock

        render(<HogarPendiente onHogarCreado={onHogarCreado} />)

        // El refresco es automático: nadie tocó ningún botón.
        await waitFor(() =>
            expect(onHogarCreado).toHaveBeenCalledWith(
                expect.objectContaining({
                    token: 'token-nuevo',
                    idHogar: 42,
                    rol: 'Miembro',
                })
            )
        )

        expect(intentosDeRefresco(fetchMock)).toHaveLength(1)

        // refrescarSesion persiste el LoginResponse con las claves de
        // authApi.login.
        expect(localStorage.getItem('token')).toBe('token-nuevo')
        expect(JSON.parse(localStorage.getItem('usuario')).idHogar).toBe(42)

        // Con la sesión refrescada, el respaldo deja de ofrecerse.
        expect(screen.queryByText(AVISO_ACEPTADA)).not.toBeInTheDocument()
    })

    it('muestra el botón de respaldo cuando el refresco automático falla', async () => {
        const onHogarCreado = vi.fn()
        const fetchMock = fetchPendiente({
            solicitudes: [SOLICITUD_ACEPTADA],
            refrescarStatus: 500,
        })
        global.fetch = fetchMock

        render(<HogarPendiente onHogarCreado={onHogarCreado} />)

        await waitFor(() => expect(intentosDeRefresco(fetchMock)).toHaveLength(1))

        // El intento automático no pasó: queda el aviso con el botón y el
        // error del backend (manejarRespuesta propaga `message`).
        expect(await screen.findByText(AVISO_ACEPTADA)).toBeInTheDocument()
        expect(
            await screen.findByText('No se pudo actualizar la sesión.')
        ).toBeInTheDocument()
        expect(onHogarCreado).not.toHaveBeenCalled()

        // El usuario puede reintentar: un segundo POST, mismo resultado.
        fireEvent.click(
            await screen.findByRole('button', { name: 'Actualizar sesión' })
        )

        await waitFor(() => expect(intentosDeRefresco(fetchMock)).toHaveLength(2))
        expect(onHogarCreado).not.toHaveBeenCalled()
    })

    it('muestra el estado vacío de solicitudes', async () => {
        global.fetch = fetchPendiente()

        render(<HogarPendiente onHogarCreado={() => {}} />)

        expect(await screen.findByText('Aún no has enviado solicitudes de unión.')).toBeInTheDocument()
    })

    it('ofrece salir del flujo sin crear familia', async () => {
        global.fetch = fetchPendiente()

        render(<HogarPendiente onHogarCreado={() => {}} />)

        // Ancla, no botón con onClick: la salida es simplemente navegar a la
        // app, que ya no está bloqueada para cuentas sin familia.
        const enlace = await screen.findByRole('link', { name: 'Ahora no, usar la app' })
        expect(enlace).toHaveAttribute('href', '/')

        expect(
            screen.getByText('Más tarde puedes crear o unirte a una familia desde Mi familia.')
        ).toBeInTheDocument()
    })

    it('valida el mínimo de 3 caracteres antes de buscar por nombre', async () => {
        const fetchMock = fetchPendiente()
        global.fetch = fetchMock

        render(<HogarPendiente onHogarCreado={() => {}} />)

        fireEvent.change(await screen.findByLabelText('Nombre de la familia'), {
            target: { value: 'Du' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Buscar por nombre' }))

        expect(
            await screen.findByText('Ingresa al menos 3 caracteres para buscar.')
        ).toBeInTheDocument()

        // El backend responde 400 con menos de 3 caracteres: no se llama.
        expect(
            fetchMock.mock.calls.some(([url]) =>
                String(url).includes('/Hogares/buscar-por-nombre')
            )
        ).toBe(false)
    })

    it('busca por nombre y solicita unión con el idHogar', async () => {
        const fetchMock = fetchPendiente({
            coincidencias: [{ idHogar: 7, nombreFamiliar: 'Familia Argueta' }],
        })
        global.fetch = fetchMock

        render(<HogarPendiente onHogarCreado={() => {}} />)

        fireEvent.change(await screen.findByLabelText('Nombre de la familia'), {
            target: { value: 'Argueta' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Buscar por nombre' }))

        expect(await screen.findByText('Familia Argueta')).toBeInTheDocument()

        const llamadaBusqueda = fetchMock.mock.calls.find(([url]) =>
            String(url).includes('/Hogares/buscar-por-nombre')
        )
        expect(llamadaBusqueda).toBeDefined()
        expect(
            new URL(llamadaBusqueda[0], 'http://test').searchParams.get('q')
        ).toBe('Argueta')

        fireEvent.click(screen.getByRole('button', { name: 'Solicitar unirse' }))

        await waitFor(() =>
            expect(
                screen.getByText('Solicitud enviada. Espera la respuesta del administrador de la familia.')
            ).toBeInTheDocument()
        )

        // La búsqueda por nombre no expone el código público: el cuerpo del
        // POST lleva idHogar y jamás codigoPublico (el backend exige exactamente uno).
        const llamadaSolicitud = fetchMock.mock.calls.find(([url, opciones]) =>
            String(url).endsWith('/SolicitudesUnion') && opciones?.method === 'POST'
        )
        expect(llamadaSolicitud).toBeDefined()

        const cuerpo = JSON.parse(llamadaSolicitud[1].body)
        expect(cuerpo.idHogar).toBe(7)
        expect(cuerpo.codigoPublico).toBeUndefined()
    })

    it('muestra el estado vacío cuando el nombre no coincide con ninguna familia', async () => {
        global.fetch = fetchPendiente({ coincidencias: [] })

        render(<HogarPendiente onHogarCreado={() => {}} />)

        fireEvent.change(await screen.findByLabelText('Nombre de la familia'), {
            target: { value: 'Zzzzzzz' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Buscar por nombre' }))

        expect(
            await screen.findByText('No se encontraron familias con ese nombre.')
        ).toBeInTheDocument()
    })

    it('muestra el error del backend (409) al solicitar unión por nombre', async () => {
        global.fetch = fetchPendiente({
            coincidencias: [{ idHogar: 7, nombreFamiliar: 'Familia Argueta' }],
            solicitudStatus: 409,
            solicitudMessage: 'Ya enviaste una solicitud a esa familia.',
        })

        render(<HogarPendiente onHogarCreado={() => {}} />)

        fireEvent.change(await screen.findByLabelText('Nombre de la familia'), {
            target: { value: 'Argueta' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Buscar por nombre' }))

        fireEvent.click(await screen.findByRole('button', { name: 'Solicitar unirse' }))

        // Los 409 viajan con message: se muestra en lugar de un texto genérico.
        expect(
            await screen.findByText('Ya enviaste una solicitud a esa familia.')
        ).toBeInTheDocument()
    })
})
