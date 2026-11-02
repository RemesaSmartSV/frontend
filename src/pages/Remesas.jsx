import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    ArrowDownLeft,
    ArrowUpRight,
    Layers,
    List,
    Percent,
    Pencil,
    Plus,
    Receipt,
} from 'lucide-react'
import { remesasApi } from '../services/api'
import Notification from '../components/Notification'
import Loading from '../components/Loading'
import ConfirmModal from '../components/ConfirmModal'
import { EncabezadoSeccion } from '../components/ui/EncabezadoSeccion'
import { TarjetaKpi } from '../components/ui/TarjetaKpi'
import { EstadoVacio } from '../components/ui/EstadoVacio'
import { TONOS } from '../components/ui/ChipIcono'
import { CLASE_TARJETA, CLASE_TH } from '../components/ui/estilos'
import {
    formatearFecha,
    formatearMoneda,
    obtenerFechaHoy,
} from '../utils/formato'

// Valores enviados al backend; las etiquetas visibles viven en i18n.
const DIRECCIONES = ['Envio', 'Recepcion']

const CANALES = [
    'WesternUnion',
    'Giros',
    'AgenteBanco',
    'Efectivo',
    'BilleteraDigital',
    'Otro',
]

const ETIQUETAS_CANAL = {
    WesternUnion: 'remesas.canalWesternUnion',
    Giros: 'remesas.canalGiros',
    AgenteBanco: 'remesas.canalAgenteBanco',
    Efectivo: 'remesas.canalEfectivo',
    BilleteraDigital: 'remesas.canalBilleteraDigital',
    Otro: 'remesas.canalOtro',
}

// Los últimos 5 años como opciones del filtro anual (el actual primero).
const ANIOS_DISPONIBLES = Array.from(
    { length: 5 },
    (_, indice) => new Date().getFullYear() - indice
)

function crearFormularioVacio() {
    return {
        direccion: 'Recepcion',
        canal: 'WesternUnion',
        montoEnviado: '',
        montoRecibido: '',
        comision: '',
        folio: '',
        fecha: obtenerFechaHoy(),
        notas: '',
    }
}

export default function Remesas() {
    const { t } = useTranslation()

    const [anio, setAnio] = useState(() => new Date().getFullYear())
    const [remesas, setRemesas] = useState([])
    const [resumen, setResumen] = useState(null)

    const [cargando, setCargando] = useState(false)
    const [procesando, setProcesando] = useState(false)

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    const [formulario, setFormulario] = useState(crearFormularioVacio)
    const [editandoId, setEditandoId] = useState(null)

    const [confirmModal, setConfirmModal] = useState({
        abierto: false,
        id: null,
        titulo: '',
        mensaje: '',
    })

    // El año vive fuera del formulario: es el filtro de lectura de la página.
    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true)
            setError('')

            const [lista, resumenAnual] = await Promise.all([
                remesasApi.listar({ anio }),
                remesasApi.resumen(anio),
            ])

            setRemesas(Array.isArray(lista) ? lista : [])
            setResumen(resumenAnual)
        } catch (err) {
            setError(err.message || t('remesas.errorCarga'))
        } finally {
            setCargando(false)
        }
    }, [anio, t])

    useEffect(() => {
        cargarDatos()
    }, [cargarDatos])

    function manejarCambio(e) {
        const { name, value } = e.target

        setFormulario({
            ...formulario,
            [name]: value,
        })
    }

    function manejarCambioAnio(e) {
        setAnio(Number(e.target.value))
    }

    // Validación en cliente del mismo criterio del backend: montos > 0 y
    // montoRecibido <= montoEnviado. El resto de los errores (400/403/409)
    // llega del backend y se muestra tal cual desde el catch.
    function validarFormulario(datos) {
        if (!datos.fecha) {
            return t('remesas.errorFecha')
        }

        if (!(Number(datos.montoEnviado) > 0)) {
            return t('remesas.errorMontoEnviado')
        }

        if (!(Number(datos.montoRecibido) > 0)) {
            return t('remesas.errorMontoRecibido')
        }

        if (Number(datos.montoRecibido) > Number(datos.montoEnviado)) {
            return t('remesas.errorRecibidoMayor')
        }

        return ''
    }

    async function guardarRemesa(e) {
        e.preventDefault()

        const errorValidacion = validarFormulario(formulario)

        if (errorValidacion) {
            setError(errorValidacion)
            return
        }

        const datos = {
            direccion: formulario.direccion,
            canal: formulario.canal,
            montoEnviado: Number(formulario.montoEnviado),
            montoRecibido: Number(formulario.montoRecibido),
            comision: Number(formulario.comision || 0),
            folio: formulario.folio.trim() || null,
            notas: formulario.notas.trim() || null,
            fecha: formulario.fecha,
        }

        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            if (editandoId) {
                await remesasApi.actualizar(editandoId, datos)

                setMensaje(t('remesas.actualizada'))
            } else {
                await remesasApi.crear(datos)

                setMensaje(t('remesas.guardada'))
            }

            limpiarFormulario()
            await cargarDatos()
        } catch (err) {
            setError(err.message || t('remesas.errorGuardar'))
        } finally {
            setProcesando(false)
        }
    }

    function editarRemesa(remesa) {
        setEditandoId(remesa.idRemesa)

        setFormulario({
            direccion: remesa.direccion,
            canal: remesa.canal,
            montoEnviado: remesa.montoEnviado,
            montoRecibido: remesa.montoRecibido,
            comision: remesa.comision,
            folio: remesa.folio || '',
            fecha: remesa.fecha?.split('T')[0] || '',
            notas: remesa.notas || '',
        })

        setError('')
        setMensaje('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    function eliminarRemesa(id) {
        setConfirmModal({
            abierto: true,
            id,
            titulo: t('remesas.eliminarTitulo'),
            mensaje: t('remesas.eliminarMensaje'),
        })
    }

    async function confirmarEliminarRemesa() {
        const id = confirmModal.id
        setConfirmModal({ abierto: false, id: null, titulo: '', mensaje: '' })

        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            await remesasApi.eliminar(id)

            setMensaje(t('remesas.eliminada'))

            await cargarDatos()
        } catch (err) {
            // El 409 explica que otra remesa sigue vinculada a esta.
            setError(err.message || t('errors.generico'))
        } finally {
            setProcesando(false)
        }
    }

    function limpiarFormulario() {
        setEditandoId(null)
        setFormulario(crearFormularioVacio())
    }

    function nombreCanal(canal) {
        const clave = ETIQUETAS_CANAL[canal]

        return clave ? t(clave) : canal
    }

    function etiquetaDireccion(direccion) {
        return direccion === 'Envio'
            ? t('remesas.envio')
            : t('remesas.recepcion')
    }

    return (
        <div className="space-y-6">

            {/* NOTIFICACIONES */}
            <Notification
                tipo="success"
                mensaje={mensaje}
                onClose={() => setMensaje('')}
            />

            <Notification
                tipo="error"
                mensaje={error}
                onClose={() => setError('')}
            />

            {/* ENCABEZADO */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                        {t('remesas.titulo')}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        {t('remesas.descripcion')}
                    </p>
                </div>

                <div className="flex items-end gap-3">

                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="anioRemesas"
                            className="text-sm font-semibold text-slate-700"
                        >
                            {t('remesas.anio')}
                        </label>

                        <select
                            id="anioRemesas"
                            name="anio"
                            value={anio}
                            onChange={manejarCambioAnio}
                            disabled={cargando || procesando}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-gray-100"
                        >
                            {ANIOS_DISPONIBLES.map((anioOpcion) => (
                                <option
                                    key={anioOpcion}
                                    value={anioOpcion}
                                >
                                    {anioOpcion}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={cargarDatos}
                        disabled={cargando || procesando}
                        className="rounded-lg bg-[#123B8F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B2E6B] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {cargando
                            ? t('common.cargando')
                            : t('common.actualizar')}
                    </button>

                </div>
            </div>

            {/* ================================
                TARJETAS RESUMEN
            ================================= */}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {/* TOTAL ENVIADO */}
                <TarjetaKpi
                    Icono={ArrowUpRight}
                    tono="violeta"
                    etiqueta={t('remesas.totalEnviado')}
                    valor={formatearMoneda(resumen?.totalEnviado ?? 0)}
                    colorValor="text-violet-700"
                />

                {/* TOTAL RECIBIDO */}
                <TarjetaKpi
                    Icono={ArrowDownLeft}
                    tono="verde"
                    etiqueta={t('remesas.totalRecibido')}
                    valor={formatearMoneda(resumen?.totalRecibido ?? 0)}
                    colorValor="text-green-700"
                />

                {/* TOTAL DE COMISIONES: el dato estrella del registro de remesas,
                    con el tono ámbar de TONOS para distinguirlo del resto. */}
                <TarjetaKpi
                    Icono={Percent}
                    tono="ambar"
                    etiqueta={t('remesas.totalComisiones')}
                    valor={formatearMoneda(resumen?.totalComision ?? 0)}
                    colorValor="text-amber-700"
                />

                {/* CANTIDAD */}
                <TarjetaKpi
                    Icono={Layers}
                    tono="azul"
                    etiqueta={t('remesas.cantidad')}
                    valor={resumen?.cantidad ?? 0}
                    colorValor="text-blue-700"
                />
            </section>

            {/* ================================
                DESGLOSE POR CANAL
            ================================= */}

            <section className={CLASE_TARJETA}>

                <EncabezadoSeccion
                    Icono={List}
                    tono="violeta"
                    titulo={t('remesas.porCanalTitulo')}
                />

                {!resumen?.porCanal?.length ? (
                    <EstadoVacio texto={t('remesas.vacia')} />
                ) : (
                    <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-[700px] w-full border-collapse text-left text-sm">

                            <thead>
                                <tr>
                                    <th className={`${CLASE_TH} whitespace-nowrap px-3.5 py-3`}>
                                        {t('remesas.canal')}
                                    </th>

                                    <th className={`${CLASE_TH} whitespace-nowrap px-3.5 py-3`}>
                                        {t('remesas.cantidad')}
                                    </th>

                                    <th className={`${CLASE_TH} whitespace-nowrap px-3.5 py-3`}>
                                        {t('remesas.montoEnviado')}
                                    </th>

                                    <th className={`${CLASE_TH} whitespace-nowrap px-3.5 py-3`}>
                                        {t('remesas.montoRecibido')}
                                    </th>

                                    <th className={`${CLASE_TH} whitespace-nowrap px-3.5 py-3`}>
                                        {t('remesas.comision')}
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {resumen.porCanal.map((fila) => (
                                    <tr
                                        key={fila.canal}
                                        className="transition hover:bg-violet-50"
                                    >
                                        <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm font-semibold">
                                            {nombreCanal(fila.canal)}
                                        </td>

                                        <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm tabular-nums">
                                            {fila.cantidad}
                                        </td>

                                        <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm tabular-nums text-violet-600">
                                            {formatearMoneda(fila.montoEnviado)}
                                        </td>

                                        <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm tabular-nums text-green-600">
                                            {formatearMoneda(fila.montoRecibido)}
                                        </td>

                                        <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm font-bold tabular-nums text-amber-600">
                                            {formatearMoneda(fila.comision)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ================================
                FORMULARIO
            ================================= */}

            <section className={CLASE_TARJETA}>

                <EncabezadoSeccion
                    Icono={editandoId ? Pencil : Plus}
                    tono={editandoId ? 'ambar' : 'azul'}
                    titulo={
                        editandoId
                            ? t('remesas.editarTitulo')
                            : t('remesas.crearTitulo')
                    }
                />

                <form
                    onSubmit={guardarRemesa}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >

                    {/* DIRECCIÓN */}
                    <div>
                        <label
                            htmlFor="direccion"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            {t('remesas.direccion')}
                        </label>

                        <select
                            id="direccion"
                            name="direccion"
                            value={formulario.direccion}
                            onChange={manejarCambio}
                            disabled={procesando}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-gray-100"
                        >
                            {DIRECCIONES.map((direccion) => (
                                <option
                                    key={direccion}
                                    value={direccion}
                                >
                                    {etiquetaDireccion(direccion)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* CANAL */}
                    <div>
                        <label
                            htmlFor="canal"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            {t('remesas.canal')}
                        </label>

                        <select
                            id="canal"
                            name="canal"
                            value={formulario.canal}
                            onChange={manejarCambio}
                            disabled={procesando}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-gray-100"
                        >
                            {CANALES.map((canal) => (
                                <option
                                    key={canal}
                                    value={canal}
                                >
                                    {nombreCanal(canal)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* MONTO ENVIADO */}
                    <div>
                        <label
                            htmlFor="montoEnviado"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            {t('remesas.montoEnviado')}
                        </label>

                        <input
                            id="montoEnviado"
                            type="number"
                            name="montoEnviado"
                            value={formulario.montoEnviado}
                            onChange={manejarCambio}
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            disabled={procesando}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                        />
                    </div>

                    {/* MONTO RECIBIDO */}
                    <div>
                        <label
                            htmlFor="montoRecibido"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            {t('remesas.montoRecibido')}
                        </label>

                        <input
                            id="montoRecibido"
                            type="number"
                            name="montoRecibido"
                            value={formulario.montoRecibido}
                            onChange={manejarCambio}
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            disabled={procesando}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                        />
                    </div>

                    {/* COMISIÓN */}
                    <div>
                        <label
                            htmlFor="comision"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            {t('remesas.comision')}
                        </label>

                        <input
                            id="comision"
                            type="number"
                            name="comision"
                            value={formulario.comision}
                            onChange={manejarCambio}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            disabled={procesando}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                        />
                    </div>

                    {/* FECHA */}
                    <div>
                        <label
                            htmlFor="fecha"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            {t('common.fecha')}
                        </label>

                        <input
                            id="fecha"
                            type="date"
                            name="fecha"
                            value={formulario.fecha}
                            onChange={manejarCambio}
                            disabled={procesando}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-gray-100"
                        />
                    </div>

                    {/* FOLIO */}
                    <div>
                        <label
                            htmlFor="folio"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            {t('remesas.folio')}
                        </label>

                        <input
                            id="folio"
                            type="text"
                            name="folio"
                            value={formulario.folio}
                            onChange={manejarCambio}
                            placeholder={t('remesas.folioPlaceholder')}
                            disabled={procesando}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                        />
                    </div>

                    {/* NOTAS */}
                    <div>
                        <label
                            htmlFor="notas"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            {t('remesas.notas')}
                        </label>

                        <input
                            id="notas"
                            type="text"
                            name="notas"
                            value={formulario.notas}
                            onChange={manejarCambio}
                            placeholder={t('remesas.notasPlaceholder')}
                            disabled={procesando}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                        />
                    </div>

                    {/* BOTONES */}
                    <div className="flex flex-col gap-2 sm:flex-row md:col-span-2">
                        <button
                            type="submit"
                            disabled={procesando}
                            className="rounded-lg bg-[#123B8F] px-5 py-2.5 font-semibold text-white transition hover:bg-[#0B2E6B] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {procesando
                                ? t('common.guardando')
                                : editandoId
                                    ? t('remesas.actualizar')
                                    : t('remesas.guardar')}
                        </button>

                        {editandoId && (
                            <button
                                type="button"
                                onClick={limpiarFormulario}
                                disabled={procesando}
                                className="rounded-lg bg-slate-100 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {t('common.cancelar')}
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* ================================
                LISTADO
            ================================= */}

            <section className={CLASE_TARJETA}>

                <EncabezadoSeccion
                    Icono={Receipt}
                    tono="azul"
                    titulo={t('remesas.listadoTitulo')}
                    subtitulo={t('remesas.listadoDescripcion', { anio })}
                />

                {cargando ? (
                    <Loading mensaje={t('common.cargando')} />

                ) : remesas.length === 0 ? (

                    <EstadoVacio texto={t('remesas.vacia')} />

                ) : (

                    <div className="w-full overflow-x-auto rounded-lg border border-gray-200">

                        <table className="min-w-[1000px] w-full border-collapse text-left text-sm">

                            <thead>
                                <tr>
                                    <th className={`${CLASE_TH} whitespace-nowrap px-3.5 py-3`}>
                                        {t('common.fecha')}
                                    </th>

                                    <th className={`${CLASE_TH} whitespace-nowrap px-3.5 py-3`}>
                                        {t('remesas.direccion')}
                                    </th>

                                    <th className={`${CLASE_TH} whitespace-nowrap px-3.5 py-3`}>
                                        {t('remesas.canal')}
                                    </th>

                                    <th className={`${CLASE_TH} whitespace-nowrap px-3.5 py-3`}>
                                        {t('remesas.montoEnviado')}
                                    </th>

                                    <th className={`${CLASE_TH} whitespace-nowrap px-3.5 py-3`}>
                                        {t('remesas.montoRecibido')}
                                    </th>

                                    <th className={`${CLASE_TH} whitespace-nowrap px-3.5 py-3`}>
                                        {t('remesas.comision')}
                                    </th>

                                    <th className={`${CLASE_TH} whitespace-nowrap px-3.5 py-3`}>
                                        {t('remesas.folio')}
                                    </th>

                                    <th className={`${CLASE_TH} px-3.5 py-3`}>
                                        {t('remesas.notas')}
                                    </th>

                                    <th className={`${CLASE_TH} whitespace-nowrap px-3.5 py-3`}>
                                        {t('common.acciones')}
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {remesas.map((remesa) => (
                                    <tr
                                        key={remesa.idRemesa}
                                        className="transition hover:bg-violet-50"
                                    >
                                        <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                            {formatearFecha(remesa.fecha)}
                                        </td>

                                        <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                            <span
                                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    remesa.direccion === 'Envio'
                                                        ? TONOS.azul
                                                        : TONOS.verde
                                                }`}
                                            >
                                                {etiquetaDireccion(remesa.direccion)}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                            {nombreCanal(remesa.canal)}
                                        </td>

                                        <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm tabular-nums text-violet-600">
                                            {formatearMoneda(remesa.montoEnviado)}
                                        </td>

                                        <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm tabular-nums text-green-600">
                                            {formatearMoneda(remesa.montoRecibido)}
                                        </td>

                                        <td className="whitespace-nowrap border-b border-gray-200 px-3.5 py-3.5 text-sm font-bold tabular-nums text-amber-600">
                                            {formatearMoneda(remesa.comision)}
                                        </td>

                                        <td className="max-w-[150px] break-words border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                            {remesa.folio || '-'}
                                        </td>

                                        <td className="max-w-[220px] break-words border-b border-gray-200 px-3.5 py-3.5 text-sm">
                                            {remesa.notas || '-'}
                                        </td>

                                        <td className="border-b border-gray-200 px-3.5 py-3.5 text-sm">

                                            <div className="flex flex-col gap-2 sm:flex-row">

                                                <button
                                                    type="button"
                                                    onClick={() => editarRemesa(remesa)}
                                                    disabled={procesando}
                                                    className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${TONOS.ambar} hover:bg-yellow-200`}
                                                >
                                                    {t('common.editar')}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => eliminarRemesa(remesa.idRemesa)}
                                                    disabled={procesando}
                                                    className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${TONOS.rojo} hover:bg-red-200`}
                                                >
                                                    {procesando
                                                        ? t('common.procesando')
                                                        : t('common.eliminar')}
                                                </button>

                                            </div>

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <ConfirmModal
                abierto={confirmModal.abierto}
                titulo={confirmModal.titulo}
                mensaje={confirmModal.mensaje}
                onConfirmar={confirmarEliminarRemesa}
                onCancelar={() => setConfirmModal({ abierto: false, id: null, titulo: '', mensaje: '' })}
            />
        </div>
    )
}
