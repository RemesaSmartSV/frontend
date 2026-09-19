export function formatearMoneda(monto) {
    const numero = Number(monto) || 0
    return `$${numero.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`
}

export function obtenerFechaHoy() {
    return new Date().toISOString().split('T')[0]
}
