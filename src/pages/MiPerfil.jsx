import { useEffect, useState } from 'react'
import { hogaresApi, usuariosApi } from '../services/api'
import Loading from '../components/Loading'
import Notification from '../components/Notification'

// Perfil propio: único editable es el nombre (PUT /api/Usuarios/perfil).
// No hay endpoints para cambiar correo ni contraseña, así que la página
// no ofrece UI para eso.
export default function MiPerfil() {
    const [usuario, setUsuario] = useState(null)
    const [nombreHogar, setNombreHogar] = useState('')
    const [nombre, setNombre] = useState('')
    // Último nombre confirmado: "Cancelar" restaura este valor.
    const [nombreGuardado, setNombreGuardado] = useState('')

    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)

    const [exito, setExito] = useState('')
    const [error, setError] = useState('')
    // Validación de campo: inline, con aria-describedby/aria-invalid.
    const [errorCampo, setErrorCampo] = useState('')

    useEffect(() => {
        let vigente = true

        async function cargarPerfil() {
            let datos = null

            try {
                const usuarioGuardado = localStorage.getItem('usuario')
                if (usuarioGuardado) {
                    datos = JSON.parse(usuarioGuardado)
                }
            } catch {
                // Valor corrupto: la pantalla queda en blanco de datos,
                // no se rompe el arranque.
            }

            if (vigente && datos && typeof datos === 'object') {
                setUsuario(datos)
                setNombre(datos.nombre || '')
                setNombreGuardado(datos.nombre || '')
            }

            // El nombre del hogar es informativo: si el GET falla (404
            // cuando aún no hay hogar) se muestra "Sin hogar".
            try {
                const hogar = await hogaresApi.obtenerMiHogar()

                if (vigente && hogar?.nombreFamiliar) {
                    setNombreHogar(hogar.nombreFamiliar)
                }
            } catch {
                if (vigente) {
                    setNombreHogar('')
                }
            } finally {
                if (vigente) {
                    setCargando(false)
                }
            }
        }

        cargarPerfil()

        return () => {
            vigente = false
        }
    }, [])

    function ariaDeCampo(valor) {
        return valor
            ? {
                  'aria-invalid': 'true',
                  'aria-describedby': 'perfil-error-campo',
              }
            : {}
    }

    function cancelar() {
        setNombre(nombreGuardado)
        setErrorCampo('')
    }

    async function guardar(e) {
        e.preventDefault()

        setExito('')
        setError('')

        if (!nombre.trim()) {
            setErrorCampo('El nombre no puede estar vacío.')
            return
        }

        setErrorCampo('')

        try {
            setGuardando(true)

            await usuariosApi.actualizarPerfil(nombre.trim())

            const datos = { ...usuario, nombre: nombre.trim() }

            // Misma clave 'usuario' que persiste authApi.login; así el
            // nombre editado sobrevive a una recarga.
            localStorage.setItem('usuario', JSON.stringify(datos))
            setUsuario(datos)
            setNombre(nombre.trim())
            setNombreGuardado(nombre.trim())
            setExito('Perfil actualizado correctamente.')
        } catch (err) {
            setError(
                err.message ||
                'No se pudo actualizar tu perfil. Inténtalo nuevamente.'
            )
        } finally {
            setGuardando(false)
        }
    }

    if (cargando) {
        return (
            <main className="min-w-0">
                <Loading mensaje="Cargando tu perfil..." />
            </main>
        )
    }

    return (
        <main className="min-w-0">

            {/* NOTIFICACIÓN DE ÉXITO */}
            <Notification
                tipo="success"
                mensaje={exito}
                onClose={() => setExito('')}
            />

            {/* NOTIFICACIÓN DE ERROR */}
            <Notification
                tipo="error"
                mensaje={error}
                onClose={() => setError('')}
            />

            <h1 className="mb-6 text-2xl font-bold text-gray-800">
                Mi perfil
            </h1>

            <section className="w-full max-w-[520px] rounded-2xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] sm:p-8">

                <form onSubmit={guardar} className="flex flex-col gap-5">

                    {/* NOMBRE (EDITABLE) */}
                    <div className="flex min-w-0 flex-col gap-2">

                        <label
                            htmlFor="perfil-nombre"
                            className="text-sm font-semibold text-gray-700"
                        >
                            Nombre
                        </label>

                        <input
                            id="perfil-nombre"
                            type="text"
                            value={nombre}
                            onChange={(e) => {
                                setNombre(e.target.value)
                                setErrorCampo('')
                            }}
                            placeholder="Tu nombre"
                            autoComplete="name"
                            disabled={guardando}
                            {...ariaDeCampo(errorCampo)}
                            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                    </div>

                    {/* ERROR DE VALIDACIÓN ASOCIADO AL CAMPO */}
                    {errorCampo && (
                        <p
                            id="perfil-error-campo"
                            role="alert"
                            className="-mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                        >
                            {errorCampo}
                        </p>
                    )}

                    {/* CORREO (SOLO LECTURA) */}
                    <div className="flex min-w-0 flex-col gap-2">

                        <label
                            htmlFor="perfil-correo"
                            className="text-sm font-semibold text-gray-700"
                        >
                            Correo
                        </label>

                        <input
                            id="perfil-correo"
                            type="email"
                            value={usuario?.correo || ''}
                            readOnly
                            aria-readonly="true"
                            className="w-full min-w-0 cursor-default rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-base text-gray-500 outline-none"
                        />

                    </div>

                    {/* ROL (SOLO LECTURA) */}
                    <div className="flex min-w-0 flex-col gap-2">

                        <label
                            htmlFor="perfil-rol"
                            className="text-sm font-semibold text-gray-700"
                        >
                            Rol
                        </label>

                        <input
                            id="perfil-rol"
                            type="text"
                            value={usuario?.rol || 'Sin asignar'}
                            readOnly
                            aria-readonly="true"
                            className="w-full min-w-0 cursor-default rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-base text-gray-500 outline-none"
                        />

                    </div>

                    {/* HOGAR (SOLO LECTURA) */}
                    <div className="flex min-w-0 flex-col gap-2">

                        <label
                            htmlFor="perfil-hogar"
                            className="text-sm font-semibold text-gray-700"
                        >
                            Hogar
                        </label>

                        <input
                            id="perfil-hogar"
                            type="text"
                            value={nombreHogar || 'Sin hogar'}
                            readOnly
                            aria-readonly="true"
                            className="w-full min-w-0 cursor-default rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-base text-gray-500 outline-none"
                        />

                    </div>

                    {/* ACCIONES */}
                    <div className="mt-1 flex flex-col gap-3 sm:flex-row">

                        <button
                            type="submit"
                            disabled={guardando}
                            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                            {guardando && (
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                            )}

                            {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </button>

                        <button
                            type="button"
                            onClick={cancelar}
                            disabled={guardando}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-base font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancelar
                        </button>

                    </div>

                </form>

            </section>

        </main>
    )
}
