import { useEffect, useRef, useState } from 'react'
import { Bell, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useTranslation } from 'react-i18next'

export default function Navbar({
    usuario,
    nombreFamiliar,
    menuAbierto,
    setMenuAbierto,
    alertas,
    cargandoAlertas,
    errorAlertas,
    notificaciones = [],
    invitaciones = [],
    procesandoInvitacion = false,
    errorInvitacion = '',
    onResponderInvitacion,
    onMarcarLeida
}) {
    const { t } = useTranslation()
    const nombreHogar =
        nombreFamiliar ||
        usuario?.familia ||
        usuario?.nombreFamiliar ||
        'Sin familia'

    const [alertasAbiertas, setAlertasAbiertas] = useState(false)
    const alertasRef = useRef(null)

    useEffect(() => {
        function cerrarAlClickearFuera(e) {
            if (alertasRef.current && !alertasRef.current.contains(e.target)) {
                setAlertasAbiertas(false)
            }
        }

        if (alertasAbiertas) {
            document.addEventListener('mousedown', cerrarAlClickearFuera)
        }

        return () => {
            document.removeEventListener('mousedown', cerrarAlClickearFuera)
        }
    }, [alertasAbiertas])

    return (
        <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white lg:ml-64">

            <div className="flex h-full items-center px-4 sm:px-6 lg:px-8">

                {/* BOTÓN MENÚ - SOLO CELULAR */}
                <button
                    type="button"
                    onClick={() => setMenuAbierto(!menuAbierto)}
                    className="mr-3 rounded-lg p-2 text-2xl text-[#123B8F] hover:bg-blue-50 lg:hidden"
                    aria-label={
                        menuAbierto
                            ? t('shell.closeMenu')
                            : t('shell.openMenu')
                    }
                    aria-expanded={menuAbierto}
                    aria-controls="menu-lateral"
                >
                    {menuAbierto ? '✕' : '☰'}
                </button>

                {/* NOMBRE EN CELULAR */}
                <p className="text-base font-bold text-[#123B8F] lg:hidden">
                    {t('shell.familyPrefix', { name: nombreHogar })}
                </p>

                {/* INFORMACIÓN DEL HOGAR EN COMPUTADORA */}
                <div className="hidden lg:block">
                    <p className="text-xs font-medium tracking-wider text-gray-500">
                        {t('shell.activeHome')}
                    </p>

                    <p className="text-base font-bold text-gray-800">
                        {nombreHogar}
                    </p>
                </div>

            </div>

            <div className="absolute right-4 top-0 flex h-full items-center gap-2 sm:right-6">

                {/* Toggle tema claro/oscuro */}
                <ThemeToggle />

                <div className="relative" ref={alertasRef}>
                    <button
                        type="button"
                        onClick={() => setAlertasAbiertas(!alertasAbiertas)}
                        className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                        aria-label={t('shell.alerts')}
                        aria-expanded={alertasAbiertas}
                        aria-controls="panel-alertas"
                    >
                        <Bell size={21} />

                        {(alertas.length + invitaciones.length + notificaciones.filter((n) => !n.leida).length) > 0 && (
                            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                {(alertas.length + invitaciones.length + notificaciones.filter((n) => !n.leida).length) > 9
                                    ? '9+'
                                    : alertas.length + invitaciones.length + notificaciones.filter((n) => !n.leida).length}
                            </span>
                        )}
                    </button>

                    {alertasAbiertas && (
                        <div
                            id="panel-alertas"
                            className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
                        >
                            {invitaciones.length > 0 && (
                                <div className="mb-4">
                                    <h2 className="mb-2 font-semibold text-gray-800">
                                        {t('shell.familyInvitations')}
                                    </h2>

                                    {errorInvitacion && (
                                        <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                                            {errorInvitacion}
                                        </p>
                                    )}

                                    <ul className="space-y-2">
                                        {invitaciones.map((inv) => (
                                            <li
                                                key={inv.idInvitacion}
                                                className="rounded-lg border border-blue-200 bg-blue-50 p-3"
                                            >
                                                <p className="text-sm text-gray-700">
                                        {t('shell.invitationMessage')}
                                                </p>

                                                <div className="mt-2 flex gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={procesandoInvitacion}
                                                        onClick={() => onResponderInvitacion?.(inv.idInvitacion, 'aceptar')}
                                                        className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        {t('common.aceptar')}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={procesandoInvitacion}
                                                        onClick={() => onResponderInvitacion?.(inv.idInvitacion, 'rechazar')}
                                                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        {t('common.rechazar')}
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {notificaciones.length > 0 && (
                                <div className="mb-4">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <h2 className="font-semibold text-gray-800">
                                            {t('shell.notifications')}
                                        </h2>

                                        <span className="text-xs text-gray-500">
                                            {t('shell.unread', { count: notificaciones.filter((n) => !n.leida).length })}
                                        </span>
                                    </div>

                                    <ul className="max-h-56 space-y-2 overflow-y-auto">
                                        {notificaciones.map((notif) => (
                                            <li
                                                key={notif.idNotificacion}
                                                className={`rounded-lg p-3 text-sm ${notif.leida ? 'bg-gray-50 text-gray-500' : 'bg-indigo-50 text-gray-700'}`}
                                            >
                                                <p>{notif.mensaje}</p>

                                                {!notif.leida && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onMarcarLeida?.(notif.idNotificacion)}
                                                        className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                        {t('shell.markRead')}
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 className="font-semibold text-gray-800">
                                    {t('shell.budgetAlerts')}
                                </h2>

                                {alertas.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                        {t('shell.activeCount', { count: alertas.length })}
                                    </span>
                                )}
                            </div>

                            {cargandoAlertas && (
                                <p className="text-sm text-gray-500">
                                    {t('shell.checkingAlerts')}
                                </p>
                            )}

                            {!cargandoAlertas && errorAlertas && (
                                <p className="text-sm text-red-600">
                                    {t('shell.alertsLoadFailed')}
                                </p>
                            )}

                            {!cargandoAlertas && !errorAlertas && alertas.length === 0 && (
                                <p className="text-sm text-gray-500">
                                    {t('shell.noCurrentAlerts')}
                                </p>
                            )}

                            {!cargandoAlertas && !errorAlertas && alertas.length > 0 && (
                                <ul className="max-h-72 space-y-3 overflow-y-auto">
                                    {alertas.map((alerta, indice) => {
                                        const esCritica = alerta.tipoAlerta === 'Crítico'

                                        return (
                                            <li
                                                key={`${alerta.tipoAlerta}-${indice}`}
                                                className={`rounded-lg border-l-4 p-3 ${esCritica
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-amber-500 bg-amber-50'
                                                    }`}
                                            >
                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                    <strong className={`text-xs uppercase ${esCritica ? 'text-red-700' : 'text-amber-700'}`}>
                                                        {alerta.tipoAlerta === 'Crítico' ? t('shell.critical') : t('shell.warning')}
                                                    </strong>
                                                    <span className="text-xs font-semibold text-gray-600">
                                                        {alerta.porcentajeUsado}%
                                                    </span>
                                                </div>

                                                <p className="text-sm leading-5 text-gray-700">
                                                    {alerta.mensaje}
                                                </p>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <div className="hidden text-right sm:block">
                    <p className="text-xs text-gray-500">
                        {t('shell.hello')}
                    </p>

                    <p className="font-semibold text-gray-700">
                        {usuario?.nombre || t('shell.unknownUser')}
                    </p>

                    <p className="text-xs text-gray-500">
                        {usuario?.rol === 'Admin' ? t('family.admin') : t('family.member')}
                    </p>
                </div>

                {/* Enlace al perfil propio. Es un ancla simple (mismo
                    patrón que los enlaces legales) para que el Navbar siga
                    renderizando fuera de un Router en los tests. */}
                <a
                    href="/perfil"
                    aria-label={t('shell.profile')}
                    title={t('shell.profile')}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 transition hover:ring-2 hover:ring-blue-300 sm:h-10 sm:w-10 sm:text-base"
                >
                    {(usuario?.nombre || 'U')
                        .charAt(0)
                        .toUpperCase()}
                </a>

            </div>

        </header>
    )
}

function ThemeToggle() {
    const { tema, cambiarTema } = useTheme()
    const { t } = useTranslation()

    return (
        <button
            type="button"
            onClick={() => cambiarTema(tema === 'oscuro' ? 'claro' : 'oscuro')}
            aria-label={tema === 'oscuro' ? t('shell.lightMode') : t('shell.darkMode')}
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
            {tema === 'oscuro' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    )
}
