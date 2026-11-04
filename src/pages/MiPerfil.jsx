import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router-dom'
import { AtSign, KeyRound, Languages, Monitor, Moon, Palette, Sun, User } from 'lucide-react'
import { normalizarIdioma } from '../i18n/index.js'
import { traducirMensaje } from '../utils/traducirMensaje'
import { hogaresApi, usuariosApi } from '../services/api'
import { useTheme } from '../context/ThemeContext.jsx'
import Loading from '../components/Loading'
import Notification from '../components/Notification'
import { EncabezadoSeccion } from '../components/ui/EncabezadoSeccion'
import { CLASE_TARJETA } from '../components/ui/estilos'

// Perfil completo con secciones: Información personal, Apariencia, Idioma.
// El cambio de contraseña va en la sección de seguridad (F7).
// Rol, IdHogar y Correo no se editan aquí: no hay endpoints de auto-servicio
// para ellos y no deben escalarse desde el frontend.

// Foto de perfil por archivo (T3): se valida en el cliente, se reduce con
// canvas a 512×512 (JPEG ~0.82) y se sube en Guardar cambios. El backend
// guarda los bytes en Postgres y sirve la imagen por /api/Usuarios/foto/{id}.
const TIPOS_FOTO_PERMITIDOS = ['image/png', 'image/jpeg']
const TAMANIO_MAXIMO_FOTO = 5 * 1024 * 1024
const LADO_MAXIMO_FOTO = 512
const CALIDAD_JPEG_FOTO = 0.82

function leerComoDataUrl(archivo) {
    return new Promise((resolver, rechazar) => {
        const lector = new FileReader()
        lector.onload = () => resolver(lector.result)
        lector.onerror = () => rechazar(new Error('No se pudo leer la imagen.'))
        lector.readAsDataURL(archivo)
    })
}

function cargarImagen(url) {
    return new Promise((resolver, rechazar) => {
        const imagen = new Image()
        imagen.onload = () => resolver(imagen)
        imagen.onerror = () => rechazar(new Error('No se pudo decodificar la imagen.'))
        imagen.src = url
    })
}

function dataUrlAArchivo(dataUrl, nombre) {
    const base64 = dataUrl.split(',')[1] || ''
    const binario = atob(base64)
    const bytes = new Uint8Array(binario.length)
    for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i)
    return new File([bytes], nombre, { type: 'image/jpeg' })
}

// Reduce la imagen con canvas (máx 512×512, JPEG ~0.82) para no subir
// megabytes de un teléfono. Si el entorno no puede decodificar (canvas o
// createObjectURL no disponibles), se conserva el archivo original ya
// validado: la subida nunca queda bloqueada por el resize.
async function prepararFoto(archivo) {
    let urlObjeto = null

    try {
        urlObjeto = URL.createObjectURL(archivo)
        const imagen = await cargarImagen(urlObjeto)
        const ladoOriginal = Math.max(imagen.naturalWidth, imagen.naturalHeight) || 1
        const escala = Math.min(1, LADO_MAXIMO_FOTO / ladoOriginal)

        const lienzo = document.createElement('canvas')
        lienzo.width = Math.max(1, Math.round(imagen.naturalWidth * escala))
        lienzo.height = Math.max(1, Math.round(imagen.naturalHeight * escala))

        const contexto = lienzo.getContext('2d')
        if (!contexto) throw new Error('Sin contexto 2d.')
        contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height)

        const vistaPrevia = lienzo.toDataURL('image/jpeg', CALIDAD_JPEG_FOTO)
        const nombre = `${(archivo.name || 'foto').replace(/\.[^.]*$/, '')}.jpg`
        return { archivo: dataUrlAArchivo(vistaPrevia, nombre), vistaPrevia }
    } catch {
        return { archivo, vistaPrevia: await leerComoDataUrl(archivo) }
    } finally {
        if (urlObjeto) URL.revokeObjectURL(urlObjeto)
    }
}

export default function MiPerfil() {
    const { t, i18n } = useTranslation()
    const { cambiarTema } = useTheme()
    // onSesionActualizada llega por el Outlet del Layout y refresca el estado
    // de App (usuario → Navbar) tras guardar o quitar la foto. Fuera del
    // Layout (tests que renderizan esta página directo) el contexto viene en
    // null, por eso el fallback a {} y la llamada opcional.
    const { onSesionActualizada } = useOutletContext() || {}
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

    // Foto pendiente de subir: se elige con el file input, se previsualiza
    // en local (dataURL) y recién se sube al pulsar Guardar cambios.
    const [archivoPendiente, setArchivoPendiente] = useState(null)
    const [previewFoto, setPreviewFoto] = useState('')
    const [mensajeFoto, setMensajeFoto] = useState('')
    // flag de imagen rota para volver a las iniciales con onError (URL
    // externa legacy que ya no existe).
    const [fotoRota, setFotoRota] = useState(false)

    // Estado
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [exito, setExito] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        const sincronizarIdioma = (idiomaNuevo) => {
            setIdioma(normalizarIdioma(idiomaNuevo) || 'es')
        }
        i18n.on('languageChanged', sincronizarIdioma)
        return () => i18n.off('languageChanged', sincronizarIdioma)
    }, [i18n])

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
                setIdioma(normalizarIdioma(datos.idiomaPreferido) || normalizarIdioma(i18n.resolvedLanguage) || 'es')
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
            setError(t('profile.nameRequired'))
            return
        }

        try {
            setGuardando(true)

            // Si hay archivo pendiente, primero se sube la foto y la ruta que
            // devuelve el backend viaja en el PUT siguiente: el servidor y
            // localStorage quedan sincronizados con la misma fotoPerfil.
            let fotoGuardada = fotoPerfil.trim() || null

            if (archivoPendiente) {
                const respuesta = await usuariosApi.subirFoto(archivoPendiente)
                fotoGuardada = respuesta?.fotoPerfil || null
                setFotoPerfil(fotoGuardada || '')
                setArchivoPendiente(null)
                setPreviewFoto('')
                setFotoRota(false)
            }

            await usuariosApi.actualizarPerfil({
                nombre: nombre.trim(),
                apellido: apellido.trim() || null,
                nombreVisible: nombreVisible.trim() || null,
                fotoPerfil: fotoGuardada,
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
                fotoPerfil: fotoGuardada,
                telefono: telefono.trim() || null,
                idiomaPreferido: idioma,
                temaPreferido: tema,
            }
            localStorage.setItem('usuario', JSON.stringify(actualizado))
            setUsuario(actualizado)
            // Sincroniza App.usuario (Navbar) con el mismo objeto: sin esto el
            // avatar de la barra superior seguiría con la foto anterior hasta
            // el próximo login.
            onSesionActualizada?.(actualizado)

            setExito(t('profile.saveSuccess'))
        } catch (err) {
            setError(err.message || t('profile.saveError'))
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
        setArchivoPendiente(null)
        setPreviewFoto('')
        setMensajeFoto('')
        setFotoRota(false)
        setTelefono(usuario.telefono || '')
        const idiomaGuardado = normalizarIdioma(usuario.idiomaPreferido) || 'es'
        setIdioma(idiomaGuardado)
        i18n.changeLanguage(idiomaGuardado)
        setTema(usuario.temaPreferido || 'claro')
        setError('')
        setExito('')
    }

    // Valida el archivo elegido (tipo exacto + ≤5MB), lo reduce con canvas
    // y deja la vista previa local. La subira recién ocurre en Guardar cambios.
    async function manejarArchivoFoto(e) {
        const input = e.target
        const archivo = input.files?.[0]
        if (!archivo) return

        setMensajeFoto('')

        if (!TIPOS_FOTO_PERMITIDOS.includes(archivo.type)) {
            setMensajeFoto(t('profile.photoUploadWrongType'))
            input.value = ''
            return
        }

        if (archivo.size > TAMANIO_MAXIMO_FOTO) {
            setMensajeFoto(t('profile.photoUploadTooLarge'))
            input.value = ''
            return
        }

        try {
            const preparada = await prepararFoto(archivo)
            setArchivoPendiente(preparada.archivo)
            setPreviewFoto(preparada.vistaPrevia)
            setFotoRota(false)
        } catch {
            setMensajeFoto(t('profile.photoUploadError'))
        }

        // Permite volver a elegir el mismo archivo tras cancelar.
        input.value = ''
    }

    // Quitar foto: si hay un archivo elegido pero aún no subido solo se
    // descarta; si hay foto guardada se borra ya en el servidor (204) y
    // localStorage se sincroniza en el momento, igual que el resto del flujo.
    async function quitarFoto() {
        setError('')
        setExito('')
        setMensajeFoto('')

        if (archivoPendiente) {
            setArchivoPendiente(null)
            setPreviewFoto('')
        }

        if (!fotoPerfil.trim()) {
            setFotoRota(false)
            return
        }

        try {
            setGuardando(true)
            await usuariosApi.eliminarFoto()

            setFotoPerfil('')
            setFotoRota(false)
            const actualizado = { ...usuario, fotoPerfil: null }
            localStorage.setItem('usuario', JSON.stringify(actualizado))
            setUsuario(actualizado)
            // Mismo sync que en guardarPerfil: el avatar del Navbar vuelve a
            // la inicial en el momento, sin esperar otro login.
            onSesionActualizada?.(actualizado)

            setExito(t('profile.photoUploadRemoved'))
        } catch (err) {
            setError(err.message || t('profile.photoUploadError'))
        } finally {
            setGuardando(false)
        }
    }

    if (cargando) return <Loading />

    const iniciales = (nombre || nombreVisible || '?')
        .split(' ')
        .map((p) => p.charAt(0))
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()

    // Previsualización local (archivo pendiente) o la ruta guardada: funciona
    // tanto con URLs http(s) externas legacy como con /api/Usuarios/foto/{id}.
    const fuenteFoto = previewFoto || fotoPerfil.trim()
    const mostrarFoto = fuenteFoto !== '' && !fotoRota
    const hayFoto = fuenteFoto !== ''

    return (
        <div className="space-y-6">
            {/* ENCABEZADO */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">{t('profile.title')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('profile.subtitle')}</p>
            </div>

            {exito && <Notification tipo="success" mensaje={exito} onClose={() => setExito('')} />}
            {error && <Notification tipo="error" mensaje={error} onClose={() => setError('')} />}

            <form onSubmit={guardarPerfil} className="space-y-6">
                {/* SECCIÓN 1: INFORMACIÓN PERSONAL */}
                <section className={CLASE_TARJETA}>
                    <EncabezadoSeccion
                        Icono={User}
                        tono="azul"
                        titulo={t('profile.personal')}
                    />

                    {/* AVATAR + editor de la foto por archivo */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                            {mostrarFoto ? (
                                <img
                                    src={fuenteFoto}
                                    alt={t('profile.photoAlt')}
                                    className="h-full w-full object-cover"
                                    onError={() => setFotoRota(true)}
                                />
                            ) : (
                                iniciales
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <label htmlFor="fotoPerfil" className="mb-1 block text-sm font-medium text-gray-700">
                                {t('profile.photoUploadLabel')}
                            </label>
                            <input
                                id="fotoPerfil"
                                type="file"
                                accept="image/png,image/jpeg"
                                onChange={manejarArchivoFoto}
                                aria-describedby="fotoPerfil-ayuda"
                                className="block w-full text-sm text-gray-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p
                                id="fotoPerfil-ayuda"
                                className={`mt-1 text-xs ${mensajeFoto ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}
                            >
                                {mensajeFoto || t('profile.photoUploadHelp')}
                            </p>

                            {hayFoto && (
                                <button
                                    type="button"
                                    onClick={quitarFoto}
                                    disabled={guardando}
                                    className="mt-2 text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
                                >
                                    {t('profile.photoUploadRemove')}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-gray-700">
                                {t('profile.name')} *
                            </label>
                            <input
                                id="nombre"
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                                maxLength={100}
                                className="input py-2"
                            />
                        </div>

                        <div>
                            <label htmlFor="apellido" className="mb-1 block text-sm font-medium text-gray-700">
                                {t('profile.lastName')}
                            </label>
                            <input
                                id="apellido"
                                type="text"
                                value={apellido}
                                onChange={(e) => setApellido(e.target.value)}
                                maxLength={100}
                                className="input py-2"
                            />
                        </div>

                        <div>
                            <label htmlFor="nombreVisible" className="mb-1 block text-sm font-medium text-gray-700">
                                {t('profile.displayName')}
                            </label>
                            <input
                                id="nombreVisible"
                                type="text"
                                value={nombreVisible}
                                onChange={(e) => setNombreVisible(e.target.value)}
                                maxLength={100}
                                placeholder={t('profile.displayPlaceholder')}
                                className="input py-2"
                            />
                        </div>

                        <div>
                            <label htmlFor="telefono" className="mb-1 block text-sm font-medium text-gray-700">
                                {t('profile.phone')}
                            </label>
                            <input
                                id="telefono"
                                type="tel"
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                maxLength={20}
                                placeholder={t('profile.optional')}
                                className="input py-2"
                            />
                        </div>
                    </div>
                </section>

                {/* SECCIÓN 2: CUENTA (solo lectura) */}
                <section className={CLASE_TARJETA}>
                    <EncabezadoSeccion
                        Icono={AtSign}
                        tono="violeta"
                        titulo={t('profile.account')}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <span className="block text-sm text-gray-500">{t('profile.email')}</span>
                            <span className="font-medium text-gray-800">{usuario?.correo || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-sm text-gray-500">{t('profile.role')}</span>
                            <span className="font-medium text-gray-800">{usuario?.rol === 'Admin' ? t('family.admin') : usuario?.rol === 'Miembro' ? t('family.member') : t('profile.unassigned')}</span>
                        </div>
                        <div>
                            <span className="block text-sm text-gray-500">{t('profile.family')}</span>
                            <span className="font-medium text-gray-800">{nombreHogar || t('profile.noHome')}</span>
                        </div>
                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                        {t('profile.readonlyHint')}
                    </p>
                </section>

                {/* SECCIÓN 3: APARIENCIA */}
                <section className={CLASE_TARJETA}>
                    <EncabezadoSeccion
                        Icono={Palette}
                        tono="ambar"
                        titulo={t('profile.appearance')}
                    />

                    <div className="flex flex-wrap gap-3">
                        {[
                            { valor: 'claro', etiqueta: t('profile.light'), Icono: Sun },
                            { valor: 'oscuro', etiqueta: t('profile.dark'), Icono: Moon },
                            { valor: 'sistema', etiqueta: t('profile.system'), Icono: Monitor },
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
                                <span aria-hidden="true" className="flex items-center">
                                    <opcion.Icono size={16} strokeWidth={2} />
                                </span>{' '}
                                {opcion.etiqueta}
                            </button>
                        ))}
                    </div>
                </section>

                {/* SECCIÓN 4: IDIOMA */}
                <section className={CLASE_TARJETA}>
                    <EncabezadoSeccion
                        Icono={Languages}
                        tono="verde"
                        titulo={t('profile.language')}
                    />

                    <div className="flex flex-wrap gap-3">
                        {[
                            { valor: 'es', etiqueta: 'Español' },
                            { valor: 'en', etiqueta: 'English' },
                        ].map((opcion) => (
                            <button
                                key={opcion.valor}
                                type="button"
                                onClick={() => { setIdioma(opcion.valor); i18n.changeLanguage(opcion.valor) }}
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
                <div className="flex flex-wrap gap-3">
                    <button
                        type="submit"
                        disabled={guardando}
                        className="rounded-lg bg-[#123B8F] px-6 py-2.5 font-medium text-white transition hover:bg-[#0B2E6B] disabled:opacity-50"
                    >
                        {guardando ? t('common.guardando') : t('common.guardar')}
                    </button>

                    <button
                        type="button"
                        onClick={cancelarCambios}
                        disabled={guardando}
                        className="rounded-lg bg-slate-100 px-6 py-2.5 font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                    >
                        {t('common.cancelar')}
                    </button>
                </div>
            </form>

            {/* SECCIÓN 5: SEGURIDAD — Cambiar contraseña */}
            <CambiarContrasena />
        </div>
    )
}

function CambiarContrasena() {
    const { t } = useTranslation()
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
            setError(t('security.mismatch'))
            return
        }
        if (nueva.length < 6) {
            setError(t('security.tooShort'))
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
                // Este fetch no pasa por manejarRespuesta: el mapa de
                // mensajes del backend se aplica aquí, al lanzar.
                throw new Error(traducirMensaje(data.message) || t('security.changeError'))
            }

            setExito(t('security.changeSuccess'))
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
        <section className={CLASE_TARJETA}>
            <EncabezadoSeccion
                Icono={KeyRound}
                tono="azul"
                titulo={t('security.title')}
            />

            {exito && <Notification tipo="success" mensaje={exito} onClose={() => setExito('')} />}
            {error && <Notification tipo="error" mensaje={error} onClose={() => setError('')} />}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="contrasenaActual" className="mb-1 block text-sm font-medium text-gray-700">
                        {t('security.currentPassword')}
                    </label>
                    <input
                        id="contrasenaActual"
                        type="password"
                        value={actual}
                        onChange={(e) => setActual(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="input py-2"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="nuevaContrasena" className="mb-1 block text-sm font-medium text-gray-700">
                            {t('security.newPassword')}
                        </label>
                        <input
                            id="nuevaContrasena"
                            type="password"
                            value={nueva}
                            onChange={(e) => setNueva(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className="input py-2"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmarNueva" className="mb-1 block text-sm font-medium text-gray-700">
                            {t('security.confirmNewPassword')}
                        </label>
                        <input
                            id="confirmarNueva"
                            type="password"
                            value={confirmar}
                            onChange={(e) => setConfirmar(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className="input py-2"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={guardando}
                    className="rounded-lg bg-[#123B8F] px-5 py-2 font-medium text-white transition hover:bg-[#0B2E6B] disabled:opacity-50"
                >
                    {guardando ? t('security.changing') : t('security.change')}
                </button>
            </form>
        </section>
    )
}
