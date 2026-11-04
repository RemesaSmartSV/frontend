import i18n from '../i18n/index.js'

/**
 * Mensajes que el backend devuelve en `{ message }` (o `{ title }` en el
 * problem+json del 500) y que el usuario ve en flujos reales.
 *
 * La clave es el string EXACTO del backend (acentos incluidos, p. ej.
 * "Ocurrio" sin tilde) y el valor es una key de i18n cuyo texto en es.json es
 * byte-idéntico a esa misma cadena: así los tests que assertan el español
 * siguen viendo el string original.
 */
const MENSAJES_BACKEND = {
    'Credenciales incorrectas.': 'backendErrors.invalidCredentials',
    'El correo ya está registrado.': 'backendErrors.emailRegistered',
    'Las contraseñas no coinciden.': 'backendErrors.passwordMismatch',
    'Solo se permiten cuentas con direcciones de correo @gmail.com.': 'backendErrors.gmailOnly',
    'El enlace de restablecimiento no es válido o expiró.': 'backendErrors.resetLinkInvalid',
    'Ya pertenecés a un hogar.': 'backendErrors.alreadyInHousehold',
    'No se encontró una familia con ese código.': 'backendErrors.familyNotFoundCode',
    'La búsqueda debe tener al menos 3 caracteres.': 'backendErrors.familySearchMin3',
    'No se encontró una familia con ese identificador.': 'backendErrors.familyNotFoundId',
    'El código de familia no tiene un formato válido.': 'backendErrors.familyCodeInvalid',
    'Ya tienes una solicitud pendiente para esta familia.': 'backendErrors.pendingRequestExists',
    'La categoría no existe.': 'backendErrors.categoryNotFound',
    'La categoría no existe o no pertenece a tu hogar.': 'backendErrors.categoryNotInHousehold',
    'El tipo debe ser Ingreso, Gasto o Ahorro.': 'backendErrors.invalidType',
    'El idioma debe ser es o en.': 'backendErrors.invalidLanguage',
    'Ocurrio un error inesperado.': 'backendErrors.unexpectedError',
    'No perteneces a ninguna familia.': 'backendErrors.noHousehold',
    'La contraseña actual es incorrecta.': 'backendErrors.currentPasswordWrong',
}

/**
 * Traduce un mensaje del backend al idioma activo. Si el mensaje no está en
 * el mapa (404 genérico, mensaje de validación, texto del usuario…) se
 * devuelve SIN CAMBIOS: nunca se inventa traducción ni se pierde información.
 */
export function traducirMensaje(mensaje) {
    if (typeof mensaje !== 'string' || mensaje === '') return mensaje

    const clave = MENSAJES_BACKEND[mensaje]
    if (!clave) return mensaje

    const traducido = i18n.t(clave)

    // Si la key no existiera en los resources, i18n.t devuelve la key misma:
    // en ese caso mejor el texto crudo del backend.
    return traducido === clave ? mensaje : traducido
}
