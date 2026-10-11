import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { hogaresApi, usuariosApi } from '../services/api'
import { useTheme } from '../context/ThemeContext.jsx'
import Loading from '../components/Loading'
import Notification from '../components/Notification'

// Perfil completo con secciones: Información personal, Apariencia, Idioma.
// El cambio de contraseña va en la sección de seguridad (F7).
// Rol, IdHogar y Correo no se editan aquí: no hay endpoints de auto-servicio
// para ellos y no deben escalarse desde el frontend.
export default function MiPerfil() {
    const { t, i18n } = useTranslation()
    const { cambiarTema } = useTheme()
    const [usuario, setUsuario] = useState(null)
    const [nombreHogar, setNombreHogar] = useState('')

    // Información personal
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    const [nombreVisible, setNombreVisible] = useState('')
    const [fotoPerfil, setFotoPerfil] = useState('')
    const [telefono, setTelefono] = useState('')

    // Preferencias
    const [idioma, setIdioma] = useState('es')
    const [tema, setTema] = useState('claro')

    // Estado
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [exito, setExito] = useState('')
    const [error, setError] = useState('')

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
                // Valor corrupto: la pantalla queda en blanco de datos.
            }

            if (vigente && datos && typeof datos === 'object') {
                setUsuario(datos)
                setNombre(datos.nombre || '')
                setApellido(datos.apellido || '')
                setNombreVisible(datos.nombreVisible || '')
                setFotoPerfil(datos.fotoPerfil || '')
                setTelefono(datos.telefono || '')
                setIdioma(datos.idiomaPreferido || 'es')
                setTema(datos.temaPreferido || 'claro')
            }

            try {
                const hogar = await hogaresApi.obtenerMiHogar()
                if (vigente && hogar?.nombreFamiliar) {
                    setNombreHogar(hogar.nombreFamiliar)
                }
            } catch {
                // Informativo: si falla, se muestra "Sin hogar".
            }

            if (vigente) setCargando(false)
        }

        cargarPerfil()
        return () => { vigente = false }
    }, [])

    async function guardarPerfil(e) {
        e.preventDefault()
        setError('')
        setExito('')

        if (!nombre.trim()) {
            setError('El nombre es obligatorio.')
            return
        }

        try {
            setGuardando(true)

            await usuariosApi.actualizarPerfil({
                nombre: nombre.trim(),
                apellido: apellido.trim() || null,
                nombreVisible: nombreVisible.trim() || null,
                fotoPerfil: fotoPerfil.trim() || null,
                telefono: telefono.trim() || null,
                idiomaPreferido: idioma,
                temaPreferido: tema,
            })

            // Actualiza localStorage para que el resto de la app vea los cambios.
            const actualizado = {
                ...usuario,
                nombre: nombre.trim(),
                apellido: apellido.trim() || null,
                nombreVisible: nombreVisible.trim() || null,
                fotoPerfil: fotoPerfil.trim() || null,
                telefono: telefono.trim() || null,
                idiomaPreferido: idioma,
                temaPreferido: tema,
            }
            localStorage.setItem('usuario', JSON.stringify(actualizado))
            setUsuario(actualizado)

            setExito('Perfil actualizado correctamente.')
        } catch (err) {
            setError(err.message || 'No se pudo guardar el perfil. Inténtalo de nuevo.')
        } finally {
            setGuardando(false)
        }
    }

    function cancelarCambios() {
        if (!usuario) return
        setNombre(usuario.nombre || '')
        setApellido(usuario.apellido || '')
        setNombreVisible(usuario.nombreVisible || '')
        setFotoPerfil(usuario.fotoPerfil || '')
        setTelefono(usuario.telefono || '')
        setIdioma(usuario.idiomaPreferido || 'es')
        setTema(usuario.temaPreferido || 'claro')
        setError('')
        setExito('')
    }

    if (cargando) return <Loading />

    const iniciales = (nombre || '?')
        .split(' ')
        .map((p) => p.charAt(0))
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()

    return (
        <div className="space-y-6">
            {/* ENCABEZADO */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Mi perfil</h1>
                <p className="text-gray-500">Gestiona tu información personal y preferencias.</p>
            </div>

            {exito && <Notification tipo="success" mensaje={exito} onClose={() => setExito('')} />}
            {error && <Notification tipo="error" mensaje={error} onClose={() => setError('')} />}

            <form onSubmit={guardarPerfil} className="space-y-6">
                {/* SECCIÓN 1: INFORMACIÓN PERSONAL */}
                <section className="rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">Información personal</h2>

                    {/* AVATAR */}
                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                            {fotoPerfil ? (
                                <img src={fotoPerfil} alt="Foto de perfil" className="h-full w-full object-cover" />
                            ) : (
                                iniciales
                            )}
                        </div>

                        <div>
                            <label htmlFor="fotoPerfil" className="mb-1 block text-sm font-medium text-gray-700">
                                URL de foto de perfil
                            </label>
                            <input
                                id="fotoPerfil"
                                type="url"
                                value={fotoPerfil}
                                onChange={(e) => setFotoPerfil(e.target.value)}
                                placeholder="https://ejemplo.com/foto.jpg"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-400">Pega la URL de tu imagen. Deja vacío para usar iniciales.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-gray-700">
                                Nombre *
                            </label>
                            <input
                                id="nombre"
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                                maxLength={100}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="apellido" className="mb-1 block text-sm font-medium text-gray-700">
                                Apellido
                            </label>
                            <input
                                id="apellido"
                                type="text"
                                value={apellido}
                                onChange={(e) => setApellido(e.target.value)}
                                maxLength={100}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="nombreVisible" className="mb-1 block text-sm font-medium text-gray-700">
                                Nombre visible
                            </label>
                            <input
                                id="nombreVisible"
                                type="text"
                                value={nombreVisible}
                                onChange={(e) => setNombreVisible(e.target.value)}
                                maxLength={100}
                                placeholder="Cómo te ven los demás"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="telefono" className="mb-1 block text-sm font-medium text-gray-700">
                                Teléfono
                            </label>
                            <input
                                id="telefono"
                                type="tel"
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                maxLength={20}
                                placeholder="Opcional"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </section>

                {/* SECCIÓN 2: CUENTA (solo lectura) */}
                <section className="rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">Cuenta</h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <span className="block text-sm text-gray-500">Correo electrónico</span>
                            <span className="font-medium text-gray-800">{usuario?.correo || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-sm text-gray-500">Rol</span>
                            <span className="font-medium text-gray-800">{usuario?.rol || 'Sin asignar'}</span>
                        </div>
                        <div>
                            <span className="block text-sm text-gray-500">Familia</span>
                            <span className="font-medium text-gray-800">{nombreHogar || 'Sin hogar'}</span>
                        </div>
                    </div>

                    <p className="mt-3 text-xs text-gray-400">
                        El correo, el rol y la familia se gestionan desde sus secciones correspondientes.
                    </p>
                </section>

                {/* SECCIÓN 3: APARIENCIA */}
                <section className="rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">Apariencia</h2>

                    <div className="flex gap-3">
                        {[
                            { valor: 'claro', etiqueta: 'Claro', icono: '☀️' },
                            { valor: 'oscuro', etiqueta: 'Oscuro', icono: '🌙' },
                            { valor: 'sistema', etiqueta: 'Sistema', icono: '💻' },
                        ].map((opcion) => (
                            <button
                                key={opcion.valor}
                                type="button"
                                onClick={() => { setTema(opcion.valor); cambiarTema(opcion.valor) }}
                                aria-pressed={tema === opcion.valor}
                                className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                                    tema === opcion.valor
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                <span>{opcion.icono}</span> {opcion.etiqueta}
                            </button>
                        ))}
                    </div>
                </section>

                {/* SECCIÓN 4: IDIOMA */}
                <section className="rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">Idioma</h2>

                    <div className="flex gap-3">
                        {[
                            { valor: 'es', etiqueta: 'Español' },
                            { valor: 'en', etiqueta: 'English' },
                        ].map((opcion) => (
                            <button
                                key={opcion.valor}
                                type="button"
                                onClick={() => { setIdioma(opcion.valor); i18n.changeLanguage(opcion.valor); localStorage.setItem('idioma', opcion.valor) }}
                                aria-pressed={idioma === opcion.valor}
                                className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                                    idioma === opcion.valor
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                {opcion.etiqueta}
                            </button>
                        ))}
                    </div>
                </section>

                {/* BOTONES */}
                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={guardando}
                        className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>

                    <button
                        type="button"
                        onClick={cancelarCambios}
                        disabled={guardando}
                        className="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>
            </form>

            {/* SECCIÓN 5: SEGURIDAD — Cambiar contraseña */}
            <CambiarContrasena />
        </div>
    )
}

function CambiarContrasena() {
    const [actual, setActual] = useState('')
    const [nueva, setNueva] = useState('')
    const [confirmar, setConfirmar] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [exito, setExito] = useState('')
    const [error, setError] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setExito('')

        if (nueva !== confirmar) {
            setError('Las contraseñas nuevas no coinciden.')
            return
        }
        if (nueva.length < 6) {
            setError('La nueva contraseña debe tener al menos 6 caracteres.')
            return
        }

        try {
            setGuardando(true)
            const res = await fetch('/api/Usuarios/cambiar-contrasena', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    contrasenaActual: actual,
                    nuevaContrasena: nueva,
                    confirmarNueva: confirmar,
                }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.message || 'No se pudo cambiar la contraseña.')
            }

            setExito('Contraseña actualizada correctamente.')
            setActual('')
            setNueva('')
            setConfirmar('')
        } catch (err) {
            setError(err.message)
        } finally {
            setGuardando(false)
        }
    }

    return (
        <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">Seguridad</h2>

            {exito && <Notification tipo="success" mensaje={exito} onClose={() => setExito('')} />}
            {error && <Notification tipo="error" mensaje={error} onClose={() => setError('')} />}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="contrasenaActual" className="mb-1 block text-sm font-medium text-gray-700">
                        Contraseña actual
                    </label>
                    <input
                        id="contrasenaActual"
                        type="password"
                        value={actual}
                        onChange={(e) => setActual(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="nuevaContrasena" className="mb-1 block text-sm font-medium text-gray-700">
                            Nueva contraseña
                        </label>
                        <input
                            id="nuevaContrasena"
                            type="password"
                            value={nueva}
                            onChange={(e) => setNueva(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmarNueva" className="mb-1 block text-sm font-medium text-gray-700">
                            Confirmar nueva contraseña
                        </label>
                        <input
                            id="confirmarNueva"
                            type="password"
                            value={confirmar}
                            onChange={(e) => setConfirmar(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={guardando}
                    className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {guardando ? 'Cambiando...' : 'Cambiar contraseña'}
                </button>
            </form>
        </section>
    )
}
