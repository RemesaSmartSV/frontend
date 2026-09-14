import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
    it('renderiza sin errores', () => {
        render(<App />)
    })

    it('muestra el titulo de la app', () => {
        render(<App />)
        expect(screen.getByText(/RemesaSmart/i)).toBeInTheDocument()
    })
})
