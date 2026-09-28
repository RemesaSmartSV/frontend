export function formatearMoneda(monto) {
    const numero = Number(monto) || 0
    return `$${numero.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`
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
