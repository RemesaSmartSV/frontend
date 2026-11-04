import i18n from '../i18n/index.js'

/**
 * Nombres exactos de las 23 categorías que siembra el backend
 * (backend/Services/CategoriasSistema.cs, Predeterminadas).
 *
 * SON DATOS DEL SISTEMA, no del usuario: solo se traducen a inglés, solo
 * cuando la app está en EN, y solo si el nombre coincide byte a byte con una
 * semilla. Los nombres creados por el usuario nunca se tocan.
 */
const SEMILLAS = {
    Remesas: 'Remittances',
    Salario: 'Salary',
    Negocio: 'Business',
    Freelance: 'Freelance',
    'Inversión': 'Investment',
    'Otros ingresos': 'Other income',
    Alimentación: 'Food',
    Vivienda: 'Housing',
    Servicios: 'Services',
    Salud: 'Health',
    Transporte: 'Transport',
    Educación: 'Education',
    Ocio: 'Entertainment',
    Compras: 'Shopping',
    Deudas: 'Debt',
    'Otros gastos': 'Other expenses',
    'Fondo de emergencia': 'Emergency fund',
    'Vivienda propia': 'Own home',
    'Educación futura': 'Future education',
    Vehículo: 'Vehicle',
    Viajes: 'Travel',
    Tecnología: 'Technology',
    'Otros ahorros': 'Other savings',
}

/**
 * Devuelve el nombre de la categoría en inglés si (y solo si) el idioma
 * activo es EN y el nombre es una categoría sembrada por el sistema.
 * En cualquier otro caso devuelve el nombre tal cual, sin tocar datos.
 *
 * Se lee i18n.resolvedLanguage en el momento de la llamada, así que no hace
 * falta re-renderizar nada para que el cambio de idioma se refleje.
 */
export function traducirNombreCategoria(nombre) {
    if (typeof nombre !== 'string' || nombre === '') return nombre

    const idioma = String(i18n.resolvedLanguage || i18n.language || 'es')
    if (!idioma.toLowerCase().startsWith('en')) return nombre

    return SEMILLAS[nombre] ?? nombre
}
