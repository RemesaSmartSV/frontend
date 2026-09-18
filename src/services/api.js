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

        if (onUnauthorized) {
            onUnauthorized()
        }

        throw new Error('Sesión expirada. Inicia sesión nuevamente.')
    }

    let mensaje = `Error ${res.status}`

    try {
        const data = await res.json()

        if (data.message) {
            mensaje = data.message
        }
    } catch {
        // No se pudo leer la respuesta
    }

    throw new Error(mensaje)
}

function obtenerHeaders() {
    const token = obtenerToken()

    const headers = {
        'Content-Type': 'application/json',
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    return headers
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
        const res = await fetch(`${API_URL}/Categorias`, {
            headers: obtenerHeaders(),
        })

        const data = await manejarRespuesta(res)
        return extraerItems(data)
    },

    async crear(categoria) {
        const res = await fetch(`${API_URL}/Categorias`, {
            method: 'POST',
            headers: obtenerHeaders(),
            body: JSON.stringify(categoria),
        })

        return manejarRespuesta(res)
    },

    async actualizar(id, categoria) {
        const res = await fetch(`${API_URL}/Categorias/${id}`, {
            method: 'PUT',
            headers: obtenerHeaders(),
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
    async listar() {
        const res = await fetch(`${API_URL}/Movimientos`, {
            headers: obtenerHeaders(),
        })

        const data = await manejarRespuesta(res)
        return extraerItems(data)
    },

    async crear(movimiento) {
        const res = await fetch(`${API_URL}/Movimientos`, {
            method: 'POST',
            headers: obtenerHeaders(),
            body: JSON.stringify(movimiento),
        })

        return manejarRespuesta(res)
    },

    async actualizar(id, movimiento) {
        const res = await fetch(`${API_URL}/Movimientos/${id}`, {
            method: 'PUT',
            headers: obtenerHeaders(),
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
            throw new Error(`Error ${res.status}`)
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
            headers: obtenerHeaders(),
            body: JSON.stringify(presupuesto),
        })

        return manejarRespuesta(res)
    },

    async actualizar(id, presupuesto) {
        const res = await fetch(`${API_URL}/Presupuestos/${id}`, {
            method: 'PUT',
            headers: obtenerHeaders(),
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