import { Component } from 'react'
import { withTranslation } from 'react-i18next'

/**
 * Evita la pantalla en blanco: si un render lanza una excepción, se muestra
 * un mensaje recuperable con opción de recargar en lugar de dejar la app muerta.
 * Solo captura errores de render/lifecycle; los de handlers asíncronos no.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { error: null }
    }

    static getDerivedStateFromError(error) {
        return { error }
    }

    componentDidCatch(error, info) {
        // Solo consola local: no se envía nada a terceros.
        console.error('Error no controlado en la interfaz:', error, info)
    }

    render() {
        const { error } = this.state

        if (!error) {
            return this.props.children
        }

        return (
            <div
                role="alert"
                className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center"
            >
                <h1 className="text-2xl font-semibold text-gray-900">
                    {this.props.t('errorBoundary.title')}
                </h1>

                <p className="max-w-md text-sm text-gray-600">
                    {this.props.t('errorBoundary.message')}
                </p>

                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                    {this.props.t('errorBoundary.reload')}
                </button>
            </div>
        )
    }
}

export default withTranslation()(ErrorBoundary)
