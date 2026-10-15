import i18n from '../i18n/index.js'

export function obtenerLocale(idioma = i18n.resolvedLanguage) {
    return String(idioma || 'es').toLowerCase().startsWith('en') ? 'en-US' : 'es-SV'
}

export function formatearMoneda(monto) {
    const numero = Number(monto) || 0
    return new Intl.NumberFormat(obtenerLocale(), {
        style: 'currency',
        currency: 'USD',
    }).format(numero)
}

export function formatearFecha(fecha, opciones = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
    const valor = fecha instanceof Date ? fecha : parsearFechaLocal(fecha)
    if (!valor || Number.isNaN(valor.getTime())) return '-'
    return new Intl.DateTimeFormat(obtenerLocale(), opciones).format(valor)
}

export function formatearNumero(numero, opciones = {}) {
    return new Intl.NumberFormat(obtenerLocale(), opciones).format(Number(numero) || 0)
}

export function formatearMes(fecha, opciones = { month: 'long', year: 'numeric' }) {
    return formatearFecha(fecha, opciones)
}

export function obtenerFechaHoy() {
    const hoy = new Date()

    const anio = hoy.getFullYear()
    const mes = String(hoy.getMonth() + 1).padStart(2, '0')
    const dia = String(hoy.getDate()).padStart(2, '0')

    return `${anio}-${mes}-${dia}`
}

export function parsearFechaLocal(fecha) {
    if (!fecha) {
        return null
    }

    const soloFecha = String(fecha).split('T')[0]
    const partes = soloFecha.split('-').map(Number)

    if (partes.length !== 3 || partes.some(Number.isNaN)) {
        return null
    }

    const [anio, mes, dia] = partes

    return new Date(anio, mes - 1, dia)
}
