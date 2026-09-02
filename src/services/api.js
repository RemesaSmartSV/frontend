const API_URL = '/api'

function obtenerToken() {
    return localStorage.getItem('token')
}

async function manejarRespuesta(res) {
    if (res.ok) {
        if (res.status === 204) {
            return null
        }

        return await res.json()
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
export const categoriasApi = {
    async listar() {
        const res = await fetch(`${API_URL}/Categorias`, {
            headers: obtenerHeaders(),
        })

        return manejarRespuesta(res)
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

        return manejarRespuesta(res)
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