import { obtenerFechaHoy } from './formato'

// Dialecto CSV compartido por TODAS las exportaciones de cliente (Ingresos,
// Gastos, Presupuestos, Movimientos), extraído de lo que Ingresos/Gastos ya
// implementaban en duplicado:
//
// - UTF-8 BOM para que Excel reconozca acentos correctamente.
// - CADA campo entre comillas dobles (comillas internas → "").
// - Guarda de inyección de fórmulas: valores que arrancan con = + - @ \t \r
//   reciben prefijo "'" para que Excel no los evalúe.
// - Separador coma, fin de línea \n, MIME text/csv;charset=utf-8.
// - Nombre de archivo con fecha local: <nombreBase>_YYYY-MM-DD.csv.
function escaparCampo(valor) {
    let texto = String(valor).replace(/"/g, '""')

    if (/^[=+\-@\t\r]/.test(texto)) {
        texto = "'" + texto
    }

    return `"${texto}"`
}

// Construye el archivo, lo descarga y devuelve la cantidad de filas exportadas
// para que cada página dispare su propio toast de éxito.
export function exportarCsv({ encabezados, filas, nombreBase }) {
    const contenido = [
        encabezados.map(escaparCampo).join(','),
        ...filas.map((fila) => fila.map(escaparCampo).join(',')),
    ].join('\n')

    const archivo = new Blob(['\uFEFF' + contenido], {
        type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(archivo)

    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `${nombreBase}_${obtenerFechaHoy()}.csv`

    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)

    URL.revokeObjectURL(url)

    return filas.length
}
