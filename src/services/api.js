const API_URL = '/api'

let onUnauthorized = null

export function setOnUnauthorized(callback) {
    onUnauthorized = callback
}

function obtenerToken() {
    const token = localStorage.getItem('token')

    if (!token) {
        return null
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const expiracion = payload.exp * 1000

        if (Date.now() >= expiracion) {
            localStorage.removeItem('token')
            localStorage.removeItem('usuario')
            return null
        }
    } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        return null
    }

    return token
}

async function manejarRespuesta(res) {
    if (res.ok) {
        if (res.status === 204) {
            return null
        }

        return await res.json()
    }

    if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        onUnauthorized?.()
        throw new Error('Sesión expirada. Inicia sesión nuevamente.')
    }

    let mensaje = `Error ${res.status}`

    try {
        const data = await res.json()

        if (data.message || data.title || data.detail) {
            mensaje = data.message || data.detail || data.title
        } else if (data.errors) {
            mensaje = Object.values(data.errors).flat().join(' ')
        }
    } catch {
        // No se pudo leer la respuesta
    }

    throw new Error(mensaje)
}

function obtenerHeaders(incluyeBody = false) {
    const token = obtenerToken()

    const headers = {}

    if (incluyeBody) {
        headers['Content-Type'] = 'application/json'
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    return headers
}

async function listarTodasLasPaginas(ruta) {
    const pageSize = 100
    const primeraRespuesta = await fetch(
        `${API_URL}/${ruta}?page=1&pageSize=${pageSize}`,
        { headers: obtenerHeaders() }
    )
    const primeraPagina = await manejarRespuesta(primeraRespuesta)

    if (Array.isArray(primeraPagina)) {
        return primeraPagina
    }

    const items = [...(primeraPagina.items || [])]
    const totalPages = primeraPagina.totalPages || 1

    for (let page = 2; page <= totalPages; page += 1) {
        const res = await fetch(
            `${API_URL}/${ruta}?page=${page}&pageSize=${pageSize}`,
            { headers: obtenerHeaders() }
        )
        const data = await manejarRespuesta(res)
        items.push(...(data.items || []))
    }

    return items
}

export const authApi = {
    async login(correo, contrasena) {
        const res = await fetch(`${API_URL}/Auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                correo,
                contrasena,
            }),
        })

        const data = await manejarRespuesta(res)

        if (data.token) {
            localStorage.setItem('token', data.token)
            localStorage.setItem('usuario', JSON.stringify(data))
        }

        return data
    },

    async register(datos) {
        const res = await fetch(`${API_URL}/Auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos),
        })

        return manejarRespuesta(res)
    },

    cerrarSesion() {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
    },
}
export const hogaresApi = {
    async obtenerMiHogar() {
        const res = await fetch(`${API_URL}/Hogares`, {
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },

    // POST /api/Hogares: responde el LoginResponse refrescado (token nuevo,
    // rol e idHogar con valor). Quien inicia la sesión persiste; la pantalla
    // que consume este resultado guarda `token` y `usuario` con las mismas
    // claves que usa authApi.login.
    async crear(nombreFamiliar) {
        const res = await fetch(`${API_URL}/Hogares`, {
            method: 'POST',
            headers: obtenerHeaders(true),
            body: JSON.stringify({ nombreFamiliar }),
        })

        return manejarRespuesta(res)
    },
}

export const usuariosApi = {
    // GET /api/Usuarios: miembros del hogar actual (el backend filtra por IdHogar).
    async listar() {
        const res = await fetch(`${API_URL}/Usuarios`, {
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },

    // PUT /api/Usuarios/perfil: 204 sin cuerpo; manejarRespuesta devuelve null.
    async actualizarPerfil(nombre) {
        const res = await fetch(`${API_URL}/Usuarios/perfil`, {
            method: 'PUT',
            headers: obtenerHeaders(true),
            body: JSON.stringify({ nombre }),
        })

        return manejarRespuesta(res)
    },

    // PUT /api/Usuarios/{id}: solo Admin; cambia nombre y/o rol del miembro.
    async actualizarMiembro(id, datos) {
        const res = await fetch(`${API_URL}/Usuarios/${id}`, {
            method: 'PUT',
            headers: obtenerHeaders(true),
            body: JSON.stringify(datos),
        })

        return manejarRespuesta(res)
    },
}

export const invitacionesApi = {
    // GET /api/Invitaciones/mias: invitaciones pendientes dirigidas a mí.
    async mias() {
        const res = await fetch(`${API_URL}/Invitaciones/mias`, {
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },

    // GET /api/Invitaciones: invitaciones enviadas al hogar actual.
    async enviadas() {
        const res = await fetch(`${API_URL}/Invitaciones`, {
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },

    async invitar(correo) {
        const res = await fetch(`${API_URL}/Invitaciones`, {
            method: 'POST',
            headers: obtenerHeaders(true),
            body: JSON.stringify({ correo }),
        })

        return manejarRespuesta(res)
    },

    // POST /api/Invitaciones/{id}/aceptar: responde un LoginResponse refrescado
    // (token nuevo con idHogar y rol Miembro). Quien lo consume debe persistir
    // 'token' y 'usuario' igual que en authApi.login.
    async aceptar(id) {
        const res = await fetch(
            `${API_URL}/Invitaciones/${id}/aceptar`,
            {
                method: 'POST',
                headers: obtenerHeaders(),
            }
        )

        return manejarRespuesta(res)
    },

    async rechazar(id) {
        const res = await fetch(
            `${API_URL}/Invitaciones/${id}/rechazar`,
            {
                method: 'POST',
                headers: obtenerHeaders(),
            }
        )

        return manejarRespuesta(res)
    },
}

export const notificacionesApi = {
    // GET /api/Notificaciones: { items, total, sinLeer, page, pageSize }.
    async listar(page = 1, pageSize = 10) {
        const res = await fetch(
            `${API_URL}/Notificaciones?page=${page}&pageSize=${pageSize}`,
            { headers: obtenerHeaders() }
        )

        return manejarRespuesta(res)
    },

    async marcarLeida(id) {
        const res = await fetch(
            `${API_URL}/Notificaciones/${id}/marcar-leida`,
            { method: 'PUT', headers: obtenerHeaders() }
        )

        return manejarRespuesta(res)
    },

    async marcarTodasLeidas() {
        const res = await fetch(
            `${API_URL}/Notificaciones/marcar-todas-leidas`,
            { method: 'PUT', headers: obtenerHeaders() }
        )

        return manejarRespuesta(res)
    },
}

function extraerItems(respuesta) {
    if (respuesta && Array.isArray(respuesta.items)) {
        return respuesta.items
    }
    if (Array.isArray(respuesta)) {
        return respuesta
    }
    return []
}

export const categoriasApi = {
    async listar() {
        return listarTodasLasPaginas('Categorias')
    },

    async crear(categoria) {
        const res = await fetch(`${API_URL}/Categorias`, {
            method: 'POST',
            headers: obtenerHeaders(true),
            body: JSON.stringify(categoria),
        })

        return manejarRespuesta(res)
    },

    async actualizar(id, categoria) {
        const res = await fetch(`${API_URL}/Categorias/${id}`, {
            method: 'PUT',
            headers: obtenerHeaders(true),
            body: JSON.stringify(categoria),
        })

        return manejarRespuesta(res)
    },

    async eliminar(id) {
        const res = await fetch(`${API_URL}/Categorias/${id}`, {
            method: 'DELETE',
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },
}

export const movimientosApi = {
    async resumen(anio, mes) {
        const parametros = new URLSearchParams()

        if (anio != null && mes != null) {
            parametros.set('anio', anio)
            parametros.set('mes', mes)
        }

        const query = parametros.toString()
        const res = await fetch(
            `${API_URL}/Movimientos/resumen${query ? `?${query}` : ''}`,
            { headers: obtenerHeaders() }
        )

        return manejarRespuesta(res)
    },

    async listar() {
        return listarTodasLasPaginas('Movimientos')
    },

    async crear(movimiento) {
        const res = await fetch(`${API_URL}/Movimientos`, {
            method: 'POST',
            headers: obtenerHeaders(true),
            body: JSON.stringify(movimiento),
        })

        return manejarRespuesta(res)
    },

    async actualizar(id, movimiento) {
        const res = await fetch(`${API_URL}/Movimientos/${id}`, {
            method: 'PUT',
            headers: obtenerHeaders(true),
            body: JSON.stringify(movimiento),
        })

        return manejarRespuesta(res)
    },

    async eliminar(id) {
        const res = await fetch(`${API_URL}/Movimientos/${id}`, {
            method: 'DELETE',
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },

    async exportar(formato) {
        const res = await fetch(
            `${API_URL}/Movimientos/exportar?formato=${formato}`,
            { headers: obtenerHeaders() }
        )

        if (!res.ok) {
            await manejarRespuesta(res)
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const enlace = document.createElement('a')
        enlace.href = url
        enlace.download = `movimientos.${formato}`
        document.body.appendChild(enlace)
        enlace.click()
        enlace.remove()
        URL.revokeObjectURL(url)
    },
}

export const ahorroApi = {
    async listarMetas() {
        return listarTodasLasPaginas('MetasAhorro')
    },

    async crearMeta(meta) {
        const res = await fetch(`${API_URL}/MetasAhorro`, {
            method: 'POST',
            headers: obtenerHeaders(true),
            body: JSON.stringify(meta),
        })

        return manejarRespuesta(res)
    },

    async actualizarMeta(id, meta) {
        const res = await fetch(`${API_URL}/MetasAhorro/${id}`, {
            method: 'PUT',
            headers: obtenerHeaders(true),
            body: JSON.stringify(meta),
        })

        return manejarRespuesta(res)
    },

    async eliminarMeta(id) {
        const res = await fetch(`${API_URL}/MetasAhorro/${id}`, {
            method: 'DELETE',
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },

    async listarAportes(metaId) {
        const res = await fetch(`${API_URL}/Aportes?metaId=${metaId}`, {
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },

    async crearAporte(aporte) {
        const res = await fetch(`${API_URL}/Aportes`, {
            method: 'POST',
            headers: obtenerHeaders(true),
            body: JSON.stringify(aporte),
        })

        return manejarRespuesta(res)
    },

    async eliminarAporte(id) {
        const res = await fetch(`${API_URL}/Aportes/${id}`, {
            method: 'DELETE',
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },
}

export const presupuestosApi = {
    async listar() {
        const res = await fetch(`${API_URL}/Presupuestos`, {
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },

    async obtener(id) {
        const res = await fetch(`${API_URL}/Presupuestos/${id}`, {
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },

    async crear(presupuesto) {
        const res = await fetch(`${API_URL}/Presupuestos`, {
            method: 'POST',
            headers: obtenerHeaders(true),
            body: JSON.stringify(presupuesto),
        })

        return manejarRespuesta(res)
    },

    async actualizar(id, presupuesto) {
        const res = await fetch(`${API_URL}/Presupuestos/${id}`, {
            method: 'PUT',
            headers: obtenerHeaders(true),
            body: JSON.stringify(presupuesto),
        })

        return manejarRespuesta(res)
    },

    async eliminar(id) {
        const res = await fetch(`${API_URL}/Presupuestos/${id}`, {
            method: 'DELETE',
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },
}

export const alertasApi = {
    async listarPorPeriodo(fechaInicio, fechaFin) {
        function formatearFecha(fecha) {
            const año = fecha.getFullYear()
            const mes = String(fecha.getMonth() + 1).padStart(2, '0')
            const dia = String(fecha.getDate()).padStart(2, '0')

            return `${año}-${mes}-${dia}`
        }

        const parametros = new URLSearchParams({
            fechaInicio: formatearFecha(fechaInicio),
            fechaFin: formatearFecha(fechaFin),
        })

        const res = await fetch(
            `${API_URL}/Alertas/periodo?${parametros.toString()}`,
            {
                headers: obtenerHeaders(),
            }
        )

        return manejarRespuesta(res)
    },
}

export const educacionApi = {
    async listar() {
        const res = await fetch(`${API_URL}/TipsFinancieros`, {
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },

    async obtener(id) {
        const res = await fetch(`${API_URL}/TipsFinancieros/${id}`, {
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
    },
}
