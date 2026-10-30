import { useState } from 'react'
import { ArrowLeftRight, PiggyBank, Users, LineChart } from 'lucide-react'
import { authApi } from '../services/api'
import Notification from '../components/Notification'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/LanguageSelector'
import GoogleSignInButton from '../components/GoogleSignInButton'
import logoBlanco from '../assets/logo-blanco-trimmed.png'

export default function Register({ volverLogin, onLogin }) {
    const { t } = useTranslation()
    const [formulario, setFormulario] = useState({
        nombre: '',
        correo: '',
        contrasena: '',
        confirmarContrasena: '',
    })

    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')
    // Validación de campo: se muestra junto a los inputs y se asocia con
    // aria-describedby/aria-invalid para lectores de pantalla.
    const [errorCampo, setErrorCampo] = useState('')
    const [camposConError, setCamposConError] = useState([])
    const [cargando, setCargando] = useState(false)

    function marcarError(mensajeError, campos) {
        setErrorCampo(mensajeError)
        setCamposConError(campos)
    }

    function limpiarErrorCampo() {
        setErrorCampo('')
        setCamposConError([])
    }

    function ariaDe(campo) {
        return camposConError.includes(campo)
            ? {
                  'aria-invalid': 'true',
                  'aria-describedby': 'registro-error-campo',
              }
            : {}
    }

    function manejarCambio(e) {
        const { name, value } = e.target

        limpiarErrorCampo()

        setFormulario({
            ...formulario,
            [name]: value,
        })
    }

    async function registrar(e) {
        e.preventDefault()

        setMensaje('')
        setError('')

        if (
            !formulario.nombre.trim() ||
            !formulario.correo.trim() ||
            !formulario.contrasena.trim() ||
            !formulario.confirmarContrasena.trim()
        ) {
            marcarError(t('auth.completeFields'), [
                'nombre',
                'correo',
                'contrasena',
                'confirmarContrasena',
            ])
            return
        }

        // Política: solo se permiten cuentas @gmail.com.
        if (!formulario.correo.trim().toLowerCase().endsWith('@gmail.com')) {
            marcarError(t('auth.gmailOnly'), ['correo'])
            return
        }

        if (formulario.contrasena.length < 6) {
            marcarError(
                t('auth.passwordTooShort'),
                ['contrasena']
            )
            return
        }

        // La comprobación local evita un viaje al servidor cuando las claves
        // difieren; el backend (400) sigue cubriendo el resto de los casos.
        if (formulario.contrasena !== formulario.confirmarContrasena) {
            marcarError(t('auth.passwordMismatch'), [
                'confirmarContrasena',
            ])
            return
        }

        limpiarErrorCampo()

        try {
            setCargando(true)

            const datosRegistro = {
                nombre: formulario.nombre.trim(),
                correo: formulario.correo.trim(),
                contrasena: formulario.contrasena,
                confirmarContrasena: formulario.confirmarContrasena,
            }

            const respuesta =
                await authApi.register(datosRegistro)

            setMensaje(
                t('auth.registerSuccess', { name: respuesta.nombre })
            )

            setFormulario({
                nombre: '',
                correo: '',
                contrasena: '',
                confirmarContrasena: '',
            })

            // Same contract as Login: hand the full LoginResponse to the
            // parent (App), which establishes the session and mounts the
            // router — the new account enters the app already signed in.
            onLogin(respuesta)
        } catch (err) {
            setError(
                err.message ||
                t('auth.registerError')
            )
        } finally {
            setCargando(false)
        }
    }

    // AuthController.google crea la cuenta si no existe: el registro con
    // Google es la misma llamada que usa Login para entrar.
    async function registrarConGoogle(idToken, nonce) {
        setError('')
        setCargando(true)
        try {
            const datos = await authApi.loginConGoogle(idToken, nonce)
            onLogin(datos)
        } catch (err) {
            setError(err.message || t('auth.googleLoginError'))
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="flex min-h-screen">
            {/* COLUMNA IZQUIERDA — Branding (solo desktop); misma
                estructura que Login. Gradiente arbitrario dentro de la
                paleta de marca: no es bg-gradient-to-br, así que la
                variante dark global no lo pisa y el panel conserva la
                identidad en ambos temas. */}
            <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:bg-[linear-gradient(135deg,#123B8F_0%,#1D4FA3_55%,#0B2E6B_100%)] lg:p-12 lg:text-white">
                {/* Hero de marca: logo trimmed + tagline agrupados arriba */}
                <div>
                    {/* El asset trimmed es el mismo que usa el Sidebar: la
                        variante en color sería ilegible sobre este fondo. */}
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        <img src={logoBlanco} alt="RemesaSmart SV" className="h-16 w-auto" />
                    </h1>
                    <p className="mt-3 text-lg text-blue-100">{t('auth.tagline')}</p>
                </div>

                {/* Beneficios con iconos lucide en tiles bg-white/10 */}
                <div className="mt-12 space-y-5">
                    {[
                        { Icono: ArrowLeftRight, texto: t('auth.benefitTransactions') },
                        { Icono: PiggyBank, texto: t('auth.benefitSavings') },
                        { Icono: Users, texto: t('auth.benefitFamily') },
                        { Icono: LineChart, texto: t('auth.benefitCharts') },
                    ].map(({ Icono, texto }, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                                <Icono size={22} strokeWidth={1.8} />
                            </span>
                            <p className="text-blue-100">{texto}</p>
                        </div>
                    ))}
                </div>

                {/* Copyright anclado abajo sin vacíos justify-between */}
                <p className="mt-auto pt-12 text-sm text-blue-200">{t('auth.copyright')}</p>
            </div>

            {/* COLUMNA DERECHA — Formulario sobre gradiente de marca */}
            <div className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 px-4 py-12 lg:w-1/2">
                <div className="w-full max-w-md">
                    <div className="mb-4 flex justify-end">
                        <LanguageSelector />
                    </div>

                    {/* Logo móvil: imagen real (asset trimmed) sobre chip de
                        marca, visible en light y dark; solo texto no ancla la
                        marca en pantallas pequeñas. */}
                    <div className="mb-6 flex flex-col items-center text-center lg:hidden">
                        <span className="inline-flex rounded-2xl bg-[#123B8F] px-5 py-3.5">
                            <img src={logoBlanco} alt="RemesaSmart SV" className="h-8 w-auto" />
                        </span>
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t('auth.tagline')}</p>
                    </div>

                    {/* Tarjeta elevada: ancla visual del formulario */}
                    <div className="rounded-2xl bg-white p-8 shadow-xl">

                    <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {t('auth.registerTitle')}
                    </h2>
                    <p className="mb-8 text-gray-500 dark:text-gray-400">
                        {t('auth.registerDescription')}
                    </p>

                    {/* NOTIFICACIÓN DE ÉXITO */}
                    <Notification
                        tipo="success"
                        mensaje={mensaje}
                        onClose={() => setMensaje('')}
                    />

                    {/* NOTIFICACIÓN DE ERROR */}
                    <Notification
                        tipo="error"
                        mensaje={error}
                        onClose={() => setError('')}
                    />

                    {/* FORMULARIO */}
                    <form onSubmit={registrar} className="space-y-5">

                        {/* NOMBRE */}
                        <div>
                            <label htmlFor="nombre" className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t('auth.name')}
                            </label>
                            <input
                                id="nombre"
                                type="text"
                                name="nombre"
                                value={formulario.nombre}
                                onChange={manejarCambio}
                                placeholder={t('auth.enterName')}
                                autoComplete="name"
                                required
                                disabled={cargando}
                                {...ariaDe('nombre')}
                                className="input"
                            />
                        </div>

                        {/* CORREO */}
                        <div>
                            <label htmlFor="correo" className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t('auth.email')}
                            </label>
                            <input
                                id="correo"
                                type="email"
                                name="correo"
                                value={formulario.correo}
                                onChange={manejarCambio}
                                placeholder={t('auth.emailExample')}
                                autoComplete="email"
                                required
                                disabled={cargando}
                                aria-invalid={camposConError.includes('correo') ? 'true' : undefined}
                                aria-describedby={camposConError.includes('correo') ? 'registro-error-campo' : 'correo-ayuda'}
                                className="input"
                            />
                            {/* La política @gmail.com se avisa siempre, no como error tardío. */}
                            <p id="correo-ayuda" className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                {t('auth.gmailHint')}
                            </p>
                        </div>

                        {/* CONTRASEÑA */}
                        <div>
                            <label htmlFor="contrasena" className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t('auth.password')}
                            </label>
                            <input
                                id="contrasena"
                                type="password"
                                name="contrasena"
                                value={formulario.contrasena}
                                onChange={manejarCambio}
                                placeholder={t('auth.passwordMin')}
                                autoComplete="new-password"
                                minLength={6}
                                required
                                disabled={cargando}
                                {...ariaDe('contrasena')}
                                className="input"
                            />
                        </div>

                        {/* CONFIRMAR CONTRASEÑA */}
                        <div>
                            <label htmlFor="confirmarContrasena" className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t('auth.confirmPassword')}
                            </label>
                            <input
                                id="confirmarContrasena"
                                type="password"
                                name="confirmarContrasena"
                                value={formulario.confirmarContrasena}
                                onChange={manejarCambio}
                                placeholder={t('auth.repeatPassword')}
                                autoComplete="new-password"
                                required
                                disabled={cargando}
                                {...ariaDe('confirmarContrasena')}
                                className="input"
                            />
                        </div>

                        {/* ERROR DE VALIDACIÓN ASOCIADO A LOS CAMPOS */}
                        {errorCampo && (
                            <p
                                id="registro-error-campo"
                                role="alert"
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                            >
                                {errorCampo}
                            </p>
                        )}

                        {/* BOTÓN */}
                        <button
                            type="submit"
                            disabled={cargando}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-base font-bold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {cargando && (
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                            )}

                            {cargando
                                ? t('auth.registering')
                                : t('auth.registerTitle')}
                        </button>

                    </form>

                    {/* Separador */}
                    <div className="my-6 flex items-center">
                        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                        <span className="px-3 text-sm text-gray-500">{t('auth.or')}</span>
                        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                    </div>

                    {/* Botón oficial de Google Identity Services; no utiliza redirect URI. */}
                    <GoogleSignInButton
                        onCredential={registrarConGoogle}
                        onError={setError}
                        disabled={cargando}
                    />

                    {/* VOLVER AL LOGIN */}
                    <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        {t('auth.hasAccount')}{' '}
                        <button
                            type="button"
                            onClick={volverLogin}
                            disabled={cargando}
                            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                            {t('auth.login')}
                        </button>
                    </p>

                    </div>
                </div>
            </div>
        </div>
    )
}
