import { useState } from 'react'
import { authApi } from '../services/api'
import Notification from '../components/Notification'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/LanguageSelector'

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

    return (
        <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-3 font-sans sm:p-6 lg:p-8">

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

            <section className="w-full max-w-[450px] overflow-hidden rounded-2xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.1)] sm:p-8 md:p-10">
                <div className="mb-4 flex justify-end">
                    <LanguageSelector />
                </div>

                {/* ENCABEZADO */}
                <div className="mb-7 text-center sm:mb-8">

                    <h1 className="text-center text-2xl font-extrabold tracking-tight text-blue-600 sm:text-[1.8rem]">
                        RemesaSmartSV
                    </h1>

                    <h2 className="mb-2 text-2xl font-normal text-gray-900 sm:text-[1.6rem]">
                        {t('auth.registerTitle')}
                    </h2>

                    <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
                        {t('auth.registerDescription')}
                    </p>

                </div>

                {/* FORMULARIO */}
                <form
                    onSubmit={registrar}
                    className="flex min-w-0 flex-col"
                >

                    {/* NOMBRE */}
                    <div className="mb-4 flex min-w-0 flex-col gap-2 sm:mb-5">

                        <label
                            htmlFor="nombre"
                            className="text-sm font-semibold text-gray-700 sm:text-base"
                        >
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
                            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                    </div>

                    {/* CORREO */}
                    <div className="mb-4 flex min-w-0 flex-col gap-2 sm:mb-5">

                        <label
                            htmlFor="correo"
                            className="text-sm font-semibold text-gray-700 sm:text-base"
                        >
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
                            {...ariaDe('correo')}
                            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                    </div>

                    {/* CONTRASEÑA */}
                    <div className="mb-4 flex min-w-0 flex-col gap-2 sm:mb-5">

                        <label
                            htmlFor="contrasena"
                            className="text-sm font-semibold text-gray-700 sm:text-base"
                        >
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
                            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                    </div>

                    {/* CONFIRMAR CONTRASEÑA */}
                    <div className="mb-4 flex min-w-0 flex-col gap-2 sm:mb-5">

                        <label
                            htmlFor="confirmarContrasena"
                            className="text-sm font-semibold text-gray-700 sm:text-base"
                        >
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
                            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                    </div>

                    {/* ERROR DE VALIDACIÓN ASOCIADO A LOS CAMPOS */}
                    {errorCampo && (
                        <p
                            id="registro-error-campo"
                            role="alert"
                            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                        >
                            {errorCampo}
                        </p>
                    )}

                    {/* BOTÓN */}
                    <button
                        type="submit"
                        disabled={cargando}
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-blue-300 disabled:active:scale-100"
                    >

                        {cargando && (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                        )}

                        {cargando
                            ? t('auth.registering')
                            : t('auth.registerTitle')}

                    </button>

                </form>

                {/* VOLVER AL LOGIN */}
                <div className="mt-6 border-t border-gray-200 pt-5 text-center sm:mt-7 sm:pt-6">

                    <p className="mb-2.5 text-sm text-gray-500 sm:text-base">
                        {t('auth.hasAccount')}
                    </p>

                    <button
                        type="button"
                        onClick={volverLogin}
                        disabled={cargando}
                        className="bg-transparent text-base font-semibold text-blue-600 transition hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {t('auth.login')}
                    </button>

                </div>

            </section>

        </main>
    )
}
