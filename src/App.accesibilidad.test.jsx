import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import Login from './pages/Login'
import Register from './pages/Register'
import Navbar from './components/Navbar'

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

        for (const etiqueta of ['Correo', 'Contraseña']) {
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

        fireEvent.change(screen.getByLabelText('Correo'), {
            target: { value: 'a@b.com' },
        })

        expect(
            screen.queryByLabelText('Correo')
        ).not.toHaveAttribute('aria-invalid')
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('Register marca solo la contraseña cuando es demasiado corta', async () => {
        render(<Register volverLogin={() => {}} />)

        fireEvent.change(screen.getByLabelText('Nombre'), {
            target: { value: 'Ana' },
        })
        fireEvent.change(screen.getByLabelText('Correo'), {
            target: { value: 'ana@demo.com' },
        })
        fireEvent.change(screen.getByLabelText('Contraseña'), {
            target: { value: '123' },
        })
        fireEvent.change(screen.getByLabelText('Nombre familiar'), {
            target: { value: 'Familia Ana' },
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
        expect(screen.getByLabelText('Nombre')).not.toHaveAttribute(
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
