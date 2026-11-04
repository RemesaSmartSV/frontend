import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import Navbar from './Navbar'

// Avatar del chip de usuario en el Navbar: si hay fotoPerfil se pinta un
// <img> dentro del mismo circulo; sin foto (o con la imagen rota, onError)
// vuelve a la inicial del nombre. Se renderiza Navbar directo, igual que en
// App.accesibilidad.test.jsx (sin Router ni ThemeProvider: el chip usa un
// <a> simple y ThemeContext tiene valor por defecto).

afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    localStorage.clear()
})

const propsBase = {
    nombreFamiliar: 'Familia Ana',
    menuAbierto: false,
    setMenuAbierto: () => {},
    alertas: [],
    cargandoAlertas: false,
    errorAlertas: '',
}

describe('Navbar — foto de perfil en el avatar', () => {
    it('renderiza la foto de perfil en el circulo cuando usuario trae fotoPerfil', () => {
        render(
            <Navbar
                {...propsBase}
                usuario={{ nombre: 'Ana Duarte', fotoPerfil: '/api/Usuarios/foto/1' }}
            />
        )

        const foto = screen.getByAltText('Foto de perfil')
        expect(foto).toHaveAttribute('src', '/api/Usuarios/foto/1')
        expect(foto).toHaveClass('object-cover')
        // Con foto visible no se pinta la inicial.
        expect(screen.queryByText('A')).not.toBeInTheDocument()
    })

    it('renderiza la inicial cuando el usuario no tiene foto (fotoPerfil null)', () => {
        render(
            <Navbar
                {...propsBase}
                usuario={{ nombre: 'Ana Duarte', fotoPerfil: null }}
            />
        )

        expect(screen.queryByAltText('Foto de perfil')).not.toBeInTheDocument()
        expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('si la imagen falla (onError) vuelve a la inicial', () => {
        render(
            <Navbar
                {...propsBase}
                usuario={{ nombre: 'Ana Duarte', fotoPerfil: '/api/Usuarios/foto/rota' }}
            />
        )

        const foto = screen.getByAltText('Foto de perfil')

        fireEvent.error(foto)

        expect(screen.queryByAltText('Foto de perfil')).not.toBeInTheDocument()
        expect(screen.getByText('A')).toBeInTheDocument()
    })
})
