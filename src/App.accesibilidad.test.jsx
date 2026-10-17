import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import Login from './pages/Login'
import Register from './pages/Register'
import Navbar from './components/Navbar'

// El mapa replica las claves reales de src/i18n/es.json. Si un componente
// empieza a pedir una clave que no está acá, el test falla en lugar de pasar
// con texto crudo, lo que mantiene el mock sincronizado con el recurso.
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => {
            const map = {
                'app.name': 'RemesaSmartSV',
                'common.cargando': 'Cargando...',
                'common.aceptar': 'Aceptar',
                'common.rechazar': 'Rechazar',

                'auth.login': 'Iniciar sesión',
                'auth.register': 'Crear cuenta',
                'auth.loginSubtitle': 'Accede a la cuenta de tu hogar.',
                'auth.tagline': 'Tu familia, sus finanzas, un solo lugar.',
                'auth.copyright': '© 2026 RemesaSmart SV. Todos los derechos reservados.',
                'auth.correo': 'Correo electrónico',
                'auth.contrasena': 'Contraseña',
                'auth.olvidaste': '¿Olvidaste tu contraseña?',
                'auth.entrar': 'Entrar',
                'auth.or': 'o',
                'auth.noCuenta': '¿No tienes cuenta?',
                'auth.completeFields': 'Completa todos los campos.',
                'auth.gmailOnly': 'Solo se permiten cuentas con direcciones de correo @gmail.com.',
                'auth.loginError': 'No se pudo iniciar sesión. Verifica tus datos.',
                'auth.googleLoginError': 'No se pudo iniciar sesión con Google.',
                'auth.showPassword': 'Mostrar contraseña',
                'auth.hidePassword': 'Ocultar contraseña',
                'auth.learnMore': 'Conocer más sobre RemesaSmart SV',
                'auth.benefitTransactions': 'Controla ingresos y gastos familiares',
                'auth.benefitSavings': 'Crea metas de ahorro y sigue tu progreso',
                'auth.benefitFamily': 'Administra las finanzas de tu familia',
                'auth.benefitCharts': 'Visualiza tu situación financiera con gráficas',

                'auth.name': 'Nombre completo',
                'auth.email': 'Correo electrónico',
                'auth.emailExample': 'correo@ejemplo.com',
                'auth.enterName': 'Ingresa tu nombre',
                'auth.password': 'Contraseña',
                'auth.passwordMin': 'Mínimo 6 caracteres',
                'auth.confirmPassword': 'Confirmar contraseña',
                'auth.repeatPassword': 'Repite tu contraseña',
                'auth.hasAccount': '¿Ya tienes cuenta?',
                'auth.registerTitle': 'Crear cuenta',
                'auth.registerDescription':
                    'Regístrate para comenzar a administrar las finanzas de tu hogar.',
                'auth.registering': 'Registrando...',
                'auth.registerSuccess': 'Cuenta creada correctamente. Bienvenido, {{name}}',
                'auth.registerError': 'No se pudo crear la cuenta. Inténtalo nuevamente.',
                'auth.passwordTooShort': 'La contraseña debe tener al menos 6 caracteres.',
                'auth.passwordMismatch': 'Las contraseñas no coinciden.',

                'family.admin': 'Administrador',
                'family.member': 'Miembro',

                'shell.openMenu': 'Abrir menú',
                'shell.closeMenu': 'Cerrar menú',
                'shell.alerts': 'Ver alertas',
                'shell.notifications': 'Notificaciones',
                'shell.noCurrentAlerts': 'No hay alertas para el mes actual.',
                'shell.checkingAlerts': 'Consultando alertas...',
                'shell.alertsLoadFailed': 'No se pudieron cargar las alertas.',
                'shell.budgetAlerts': 'Alertas de presupuesto',
                'shell.markRead': 'Marcar leída',
                'shell.unread': '{{count}} sin leer',
                'shell.critical': 'Crítico',
                'shell.warning': 'Advertencia',
                'shell.hello': 'Hola',
                'shell.unknownUser': 'Usuario',
                'shell.profile': 'Mi perfil',
                'shell.familyPrefix': 'Familia {{name}}',
                'shell.activeHome': 'HOGAR ACTIVO',
                'shell.familyInvitations': 'Invitaciones de familia',
                'shell.invitationMessage':
                    'Te invitaron a unirte a una familia en RemesaSmart SV.',
                'shell.darkMode': 'Cambiar a modo oscuro',
                'shell.lightMode': 'Cambiar a modo claro',
            }
            return map[key] || key
        },
        i18n: { changeLanguage: () => {} },
    }),
}))

afterEach(() => cleanup())

describe('Accesibilidad de los formularios', () => {
    it('Login asocia el error de validación con los campos', async () => {
        const { container } = render(
            <Login onLogin={() => {}} irRegistro={() => {}} />
        )

        // Submit directo: no dispara la validación nativa de jsdom.
        fireEvent.submit(container.querySelector('form'))

        const alerta = await screen.findByRole('alert')
        expect(alerta).toHaveTextContent('Completa todos los campos.')
        expect(alerta).toHaveAttribute('id', 'login-error-campo')

        for (const etiqueta of ['Correo electrónico', 'Contraseña']) {
            const campo = screen.getByLabelText(etiqueta)
            expect(campo).toHaveAttribute('aria-invalid', 'true')
            expect(campo).toHaveAttribute(
                'aria-describedby',
                'login-error-campo'
            )
        }
    })

    it('Login limpia el estado inválido al escribir', async () => {
        const { container } = render(
            <Login onLogin={() => {}} irRegistro={() => {}} />
        )

        fireEvent.submit(container.querySelector('form'))
        await screen.findByRole('alert')

        fireEvent.change(screen.getByLabelText('Correo electrónico'), {
            target: { value: 'a@gmail.com' },
        })

        expect(
            screen.queryByLabelText('Correo electrónico')
        ).not.toHaveAttribute('aria-invalid')
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('Register marca solo la contraseña cuando es demasiado corta', async () => {
        render(<Register volverLogin={() => {}} />)

        fireEvent.change(screen.getByLabelText('Nombre completo'), {
            target: { value: 'Ana' },
        })
        fireEvent.change(screen.getByLabelText('Correo electrónico'), {
            target: { value: 'ana@gmail.com' },
        })
        fireEvent.change(screen.getByLabelText('Contraseña'), {
            target: { value: '123' },
        })
        fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
            target: { value: '123' },
        })

        const form = screen
            .getByRole('button', { name: 'Crear cuenta' })
            .closest('form')
        fireEvent.submit(form)

        const alerta = await screen.findByRole('alert')
        expect(alerta).toHaveTextContent(
            'La contraseña debe tener al menos 6 caracteres.'
        )
        expect(alerta).toHaveAttribute('id', 'registro-error-campo')

        expect(screen.getByLabelText('Contraseña')).toHaveAttribute(
            'aria-invalid',
            'true'
        )
        expect(screen.getByLabelText('Nombre completo')).not.toHaveAttribute(
            'aria-invalid'
        )
        // La longitud se valida antes que la coincidencia: la confirmación
        // queda limpia aunque esté completa.
        expect(
            screen.getByLabelText('Confirmar contraseña')
        ).not.toHaveAttribute('aria-invalid')
    })

    it('Register marca la confirmación cuando las contraseñas no coinciden', async () => {
        render(<Register volverLogin={() => {}} />)

        fireEvent.change(screen.getByLabelText('Nombre completo'), {
            target: { value: 'Ana' },
        })
        fireEvent.change(screen.getByLabelText('Correo electrónico'), {
            target: { value: 'ana@gmail.com' },
        })
        fireEvent.change(screen.getByLabelText('Contraseña'), {
            target: { value: 'secreta123' },
        })
        fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
            target: { value: 'distinta123' },
        })

        const form = screen
            .getByRole('button', { name: 'Crear cuenta' })
            .closest('form')
        fireEvent.submit(form)

        const alerta = await screen.findByRole('alert')
        expect(alerta).toHaveTextContent('Las contraseñas no coinciden.')
        expect(alerta).toHaveAttribute('id', 'registro-error-campo')

        expect(
            screen.getByLabelText('Confirmar contraseña')
        ).toHaveAttribute('aria-invalid', 'true')
        expect(screen.getByLabelText('Contraseña')).not.toHaveAttribute(
            'aria-invalid'
        )
    })
})

describe('Accesibilidad de la navegación', () => {
    it('el botón del menú móvil expone su estado y el panel que controla', () => {
        render(
            <Navbar
                usuario={{ nombre: 'Ana' }}
                nombreFamiliar="Familia Ana"
                menuAbierto={false}
                setMenuAbierto={() => {}}
                alertas={[]}
                cargandoAlertas={false}
                errorAlertas=""
            />
        )

        const botonMenu = screen.getByRole('button', { name: 'Abrir menú' })
        expect(botonMenu).toHaveAttribute('aria-expanded', 'false')
        expect(botonMenu).toHaveAttribute('aria-controls', 'menu-lateral')

        const botonAlertas = screen.getByRole('button', {
            name: 'Ver alertas',
        })
        expect(botonAlertas).toHaveAttribute('aria-expanded', 'false')
        expect(botonAlertas).toHaveAttribute(
            'aria-controls',
            'panel-alertas'
        )
    })

    it('el panel de alertas queda identificado por aria-controls', async () => {
        render(
            <Navbar
                usuario={{ nombre: 'Ana' }}
                nombreFamiliar="Familia Ana"
                menuAbierto={false}
                setMenuAbierto={() => {}}
                alertas={[]}
                cargandoAlertas={false}
                errorAlertas=""
            />
        )

        fireEvent.click(screen.getByRole('button', { name: 'Ver alertas' }))

        expect(
            await screen.findByRole('button', { name: 'Ver alertas' })
        ).toHaveAttribute('aria-expanded', 'true')
        expect(document.getElementById('panel-alertas')).not.toBeNull()
    })
})
