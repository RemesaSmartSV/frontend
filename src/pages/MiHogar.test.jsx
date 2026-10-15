import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import MiHogar from './MiHogar'

// El mock devuelve SIEMPRE la misma referencia de `t`: si `t` cambia en cada
// render, `useCallback([esAdmin, t])` de MiHogar se recrea, el useEffect
// re-ejecuta cargarDatos, y la página queda en un bucle de "Cargando...".
vi.mock('react-i18next', () => {
    const map = {
        'familia.titulo': 'Mi Familia',
        'familia.subtitulo': 'Administra los miembros de tu familia y sus roles.',
        'familia.miembros': 'Miembros',
        'familia.invitar': 'Invitar miembro',
        'familia.invitacionesEnviadas': 'Invitaciones enviadas',
        'familia.soloAdmin': 'Solo un administrador de la familia puede invitar nuevos miembros.',
        'family.title': 'Mi familia',
        'family.subtitle': 'Administra los miembros de tu familia y sus roles.',
        'family.members': 'Miembros',
        'family.invite': 'Invitar',
        'family.sentInvitations': 'Invitaciones enviadas',
        'family.noInvitations': 'No hay invitaciones enviadas todavía.',
        'family.soloAdmin': 'Solo un administrador de la familia puede invitar nuevos miembros.',
        'family.admin': 'Administrador',
        'family.member': 'Miembro',
        'family.invitationSent': 'Invitación enviada.',
        'family.inviteEmail': 'Correo de la persona a invitar',
        'family.inviteInfo': 'La persona recibe una notificación y puede aceptar o rechazar. Si aún no tiene cuenta, la invitación la espera registrada.',
        'family.publicCode': 'Código público de la familia',
        'family.publicCodeHint': 'Comparte este código para que otras personas puedan solicitar unirse a tu familia.',
        'family.copyCode': 'Copiar código',
        'family.codeCopied': 'Código copiado.',
        'family.codeCopyError': 'No se pudo copiar el código. Copia el código manualmente.',
        'family.joinRequests': 'Solicitudes de unión',
        'family.joinRequestsHint': 'Personas que quieren unirse a tu familia con el código público.',
        'family.noJoinRequests': 'No hay solicitudes pendientes.',
        'family.joinRequestDate': 'Solicitada {{date}}',
        'family.requestAccepted': 'Solicitud aceptada.',
        'family.requestRejected': 'Solicitud rechazada.',
        'family.requestError': 'No se pudo responder la solicitud.',
        'common.aceptar': 'Aceptar',
        'common.rechazar': 'Rechazar',
        'common.enviando': 'Enviando...',
        'common.cargando': 'Cargando...',
        'common.cerrarNotificacion': 'Cerrar notificación',
    }
    const t = (key) => map[key] || key
    return {
        useTranslation: () => ({
            t,
            i18n: { changeLanguage: () => {}, resolvedLanguage: 'es', language: 'es' },
        }),
    }
})

// Stub de fetch por ruta: Hogares, Usuarios (miembros), Invitaciones y
// SolicitudesUnion. El rol se lee de localStorage clave 'usuario' (la misma
// de authApi.login).

const fetchOriginal = global.fetch

function respuesta(cuerpo, status = 200) {
    return new Response(JSON.stringify(cuerpo), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

function sesion(rol) {
    localStorage.setItem(
        'usuario',
        JSON.stringify({ idUsuario: 1, nombre: 'Ana', correo: 'ana@demo.com', rol, idHogar: 1 })
    )
}

afterEach(() => {
    cleanup()
    global.fetch = fetchOriginal
    localStorage.clear()
    delete navigator.clipboard
})

function fetchFamilia(miembros, invitaciones = [], solicitudes = [], hogar = { idHogar: 1, nombreFamiliar: 'Familia Duarte', codigoPublico: 'RS-FAM-ABCDEF23456789XY' }) {
    return vi.fn(async (url, opciones = {}) => {
        const destino = String(url)

        if (destino.includes('/SolicitudesUnion/recibidas')) {
            return respuesta(solicitudes)
        }

        if (destino.includes('/Invitaciones')) {
            if (opciones.method === 'POST') return respuesta({ idInvitacion: 5, estado: 'Pendiente' }, 201)
            return respuesta(invitaciones)
        }

        if (destino.includes('/Hogares')) {
            return respuesta(hogar)
        }

        if (destino.includes('/Usuarios')) {
            return respuesta(miembros)
        }

        return respuesta([])
    })
}

describe('MiHogar', () => {
    it('muestra los miembros con rol y la invitación como Admin', async () => {
        sesion('Admin')
        global.fetch = fetchFamilia([
            { idUsuario: 1, nombre: 'Ana Duarte', correo: 'ana@demo.com', rol: 'Admin', fechaRegistro: '2026-01-10T00:00:00Z' },
            { idUsuario: 2, nombre: 'Beto Duarte', correo: 'beto@demo.com', rol: 'Miembro', fechaRegistro: '2026-02-01T00:00:00Z' },
        ])

        render(<MiHogar />)

        expect(await screen.findByText('Familia Duarte')).toBeInTheDocument()
        expect(await screen.findByText('Ana Duarte')).toBeInTheDocument()
        expect(screen.getByText('Beto Duarte')).toBeInTheDocument()
        // 'Administrador' puede repetirse: badge del Admin y <option> del select.
        expect(screen.getAllByText('Administrador').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Miembro').length).toBeGreaterThan(0)
        expect(screen.getByRole('button', { name: 'Invitar' })).toBeInTheDocument()
    })

    it('oculta el formulario de invitación para un Miembro', async () => {
        sesion('Miembro')
        global.fetch = fetchFamilia([
            { idUsuario: 1, nombre: 'Ana Duarte', correo: 'ana@demo.com', rol: 'Admin', fechaRegistro: '2026-01-10T00:00:00Z' },
            { idUsuario: 2, nombre: 'Beto Duarte', correo: 'beto@demo.com', rol: 'Miembro', fechaRegistro: '2026-02-01T00:00:00Z' },
        ])

        render(<MiHogar />)

        await screen.findByText('Ana Duarte')

        expect(screen.queryByRole('button', { name: 'Invitar' })).not.toBeInTheDocument()
        expect(
            screen.getByText(/Solo un administrador/)
        ).toBeInTheDocument()
    })

    it('envía una invitación desde el formulario de Admin', async () => {
        sesion('Admin')
        const fetchMock = fetchFamilia([
            { idUsuario: 1, nombre: 'Ana Duarte', correo: 'ana@demo.com', rol: 'Admin', fechaRegistro: '2026-01-10T00:00:00Z' },
        ])
        global.fetch = fetchMock

        render(<MiHogar />)

        await screen.findByText('Ana Duarte')

        fireEvent.change(screen.getByLabelText('Correo de la persona a invitar'), {
            target: { value: 'carlos@demo.com' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Invitar' }))

        await waitFor(() =>
            expect(screen.getByText('Invitación enviada.')).toBeInTheDocument()
        )

        const llamada = fetchMock.mock.calls.find(([url, opciones]) =>
            String(url).includes('/Invitaciones') && opciones?.method === 'POST'
        )
        expect(llamada).toBeDefined()
        expect(JSON.parse(llamada[1].body).correo).toBe('carlos@demo.com')
    })

    it('muestra el código público y lo copia al portapapeles', async () => {
        sesion('Admin')
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        })
        global.fetch = fetchFamilia([
            { idUsuario: 1, nombre: 'Ana Duarte', correo: 'ana@demo.com', rol: 'Admin', fechaRegistro: '2026-01-10T00:00:00Z' },
        ])

        render(<MiHogar />)

        expect(await screen.findByText('RS-FAM-ABCDEF23456789XY')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Copiar código' }))

        await waitFor(() =>
            expect(writeText).toHaveBeenCalledWith('RS-FAM-ABCDEF23456789XY')
        )
        expect(await screen.findByText('Código copiado.')).toBeInTheDocument()
    })

    it('muestra la bandeja de solicitudes con Aceptar y Rechazar como Admin', async () => {
        sesion('Admin')
        const fetchMock = fetchFamilia(
            [{ idUsuario: 1, nombre: 'Ana Duarte', correo: 'ana@demo.com', rol: 'Admin', fechaRegistro: '2026-01-10T00:00:00Z' }],
            [],
            [{ idSolicitud: 7, nombreSolicitante: 'Carla Ríos', correoSolicitante: 'carla@demo.com', estado: 'Pendiente', fechaSolicitud: '2026-02-10T00:00:00Z' }]
        )
        global.fetch = fetchMock

        render(<MiHogar />)

        expect(await screen.findByText('Carla Ríos')).toBeInTheDocument()
        expect(screen.getByText(/carla@demo\.com/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }))

        await waitFor(() =>
            expect(screen.getByText('Solicitud aceptada.')).toBeInTheDocument()
        )

        const llamada = fetchMock.mock.calls.find(([url, opciones]) =>
            String(url).includes('/SolicitudesUnion/7/aceptar') && opciones?.method === 'POST'
        )
        expect(llamada).toBeDefined()
    })

    it('rechaza una solicitud de unión desde la bandeja', async () => {
        sesion('Admin')
        const fetchMock = fetchFamilia(
            [{ idUsuario: 1, nombre: 'Ana Duarte', correo: 'ana@demo.com', rol: 'Admin', fechaRegistro: '2026-01-10T00:00:00Z' }],
            [],
            [{ idSolicitud: 8, nombreSolicitante: 'Diego Paz', correoSolicitante: 'diego@demo.com', estado: 'Pendiente', fechaSolicitud: '2026-02-11T00:00:00Z' }]
        )
        global.fetch = fetchMock

        render(<MiHogar />)

        expect(await screen.findByText('Diego Paz')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))

        await waitFor(() =>
            expect(screen.getByText('Solicitud rechazada.')).toBeInTheDocument()
        )

        const llamada = fetchMock.mock.calls.find(([url, opciones]) =>
            String(url).includes('/SolicitudesUnion/8/rechazar') && opciones?.method === 'POST'
        )
        expect(llamada).toBeDefined()
    })

    it('no muestra la bandeja de solicitudes para un Miembro', async () => {
        sesion('Miembro')
        // Si el componente pidiera /recibidas como Miembro, el stub devolvería
        // la lista y la bandeja aparecería: el assertion comprueba que no se
        // pide ni se renderiza.
        global.fetch = fetchFamilia(
            [
                { idUsuario: 1, nombre: 'Ana Duarte', correo: 'ana@demo.com', rol: 'Admin', fechaRegistro: '2026-01-10T00:00:00Z' },
                { idUsuario: 2, nombre: 'Beto Duarte', correo: 'beto@demo.com', rol: 'Miembro', fechaRegistro: '2026-02-01T00:00:00Z' },
            ],
            [],
            [{ idSolicitud: 9, nombreSolicitante: 'Eva Sol', correoSolicitante: 'eva@demo.com', estado: 'Pendiente', fechaSolicitud: '2026-02-12T00:00:00Z' }]
        )

        render(<MiHogar />)

        await screen.findByText('Ana Duarte')

        expect(screen.queryByText('Solicitudes de unión')).not.toBeInTheDocument()
        expect(screen.queryByText('Eva Sol')).not.toBeInTheDocument()
        // El código público sí es visible (y copiable) para cualquier miembro.
        expect(screen.getByText('RS-FAM-ABCDEF23456789XY')).toBeInTheDocument()
    })

    it('muestra el estado vacío de la bandeja cuando no hay solicitudes', async () => {
        sesion('Admin')
        global.fetch = fetchFamilia([
            { idUsuario: 1, nombre: 'Ana Duarte', correo: 'ana@demo.com', rol: 'Admin', fechaRegistro: '2026-01-10T00:00:00Z' },
        ])

        render(<MiHogar />)

        expect(await screen.findByText('No hay solicitudes pendientes.')).toBeInTheDocument()
    })
})
