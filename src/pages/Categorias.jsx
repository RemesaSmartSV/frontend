import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Tags } from 'lucide-react'
import { categoriasApi } from '../services/api'
import Notification from '../components/Notification'
import Loading from '../components/Loading'
import ConfirmModal from '../components/ConfirmModal'
import { EncabezadoSeccion } from '../components/ui/EncabezadoSeccion'
import { EstadoVacio } from '../components/ui/EstadoVacio'
import { TONOS } from '../components/ui/ChipIcono'
import { CLASE_TARJETA, CLASE_TH } from '../components/ui/estilos'
import { traducirNombreCategoria } from '../utils/traducirCategoria'

export default function Categorias() {
    const { t } = useTranslation()
    const [categorias, setCategorias] = useState([])
    const [nombre, setNombre] = useState('')
    const [tipo, setTipo] = useState('Gasto')
    const [icono, setIcono] = useState('')

    const [editandoId, setEditandoId] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [procesando, setProcesando] = useState(false)

    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    const [confirmModal, setConfirmModal] = useState({
        abierto: false,
        id: null,
        titulo: '',
        mensaje: '',
    })

    const cargarCategorias = useCallback(async () => {
        try {
            setCargando(true)
            setError('')

            const data = await categoriasApi.listar()
            setCategorias(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        cargarCategorias()
    }, [cargarCategorias])

    async function guardarCategoria(e) {
        e.preventDefault()

        if (!nombre.trim()) {
            setError(t('categories.nameRequired'))
            return
        }

        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            const categoria = {
                nombre: nombre.trim(),
                tipo,
                icono: icono.trim() || null,
            }

            if (editandoId) {
                await categoriasApi.actualizar(
                    editandoId,
                    categoria
                )

                setMensaje(
                    t('categories.updated')
                )
            } else {
                await categoriasApi.crear(categoria)

                setMensaje(
                    t('categories.saved')
                )
            }

            limpiarFormulario()
            await cargarCategorias()
        } catch (err) {
            setError(err.message)
        } finally {
            setProcesando(false)
        }
    }

    function editarCategoria(categoria) {
        setEditandoId(categoria.idCategoria)
        setNombre(categoria.nombre)
        setTipo(categoria.tipo)
        setIcono(categoria.icono || '')

        setMensaje('')
        setError('')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    function eliminarCategoria(id) {
        setConfirmModal({
            abierto: true,
            id,
            titulo: t('categories.deleteTitle'),
            mensaje: t('categories.deleteMessage'),
        })
    }

    async function confirmarEliminarCategoria() {
        const id = confirmModal.id
        setConfirmModal({ abierto: false, id: null, titulo: '', mensaje: '' })

        try {
            setError('')
            setMensaje('')
            setProcesando(true)

            await categoriasApi.eliminar(id)

            setMensaje(t('categories.deleted'))

            await cargarCategorias()
        } catch (err) {
            setError(err.message)
        } finally {
            setProcesando(false)
        }
    }

    function limpiarFormulario() {
        setEditandoId(null)
        setNombre('')
        setTipo('Gasto')
        setIcono('')
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
            <div className="mb-6">

                <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                    {t('nav.categorias')}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    {t('categories.description')}
                </p>

            </div>

            {/* FORMULARIO */}
            <section className={CLASE_TARJETA}>

                <EncabezadoSeccion
                    Icono={editandoId ? Pencil : Plus}
                    tono={editandoId ? 'ambar' : 'azul'}
                    titulo={
                        editandoId
                            ? t('categories.edit')
                            : t('categories.create')
                    }
                />

                <form onSubmit={guardarCategoria}>

                    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">

                        {/* NOMBRE */}
                        <div className="flex min-w-0 flex-col gap-2">

                            <label className="font-semibold text-gray-700">
                                {t('categories.name')}
                            </label>

                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) =>
                                    setNombre(e.target.value)
                                }
                                placeholder={t('categories.namePlaceholder')}
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                            />

                        </div>

                        {/* TIPO */}
                        <div className="flex min-w-0 flex-col gap-2">

                            <label className="font-semibold text-gray-700">
                                {t('categories.type')}
                            </label>

                            <select
                                value={tipo}
                                onChange={(e) =>
                                    setTipo(e.target.value)
                                }
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-gray-100"
                            >
                                <option value="Gasto">
                                    {t('nav.gastos')}
                                </option>

                                <option value="Ingreso">
                                    {t('nav.ingresos')}
                                </option>
                            </select>

                        </div>

                        {/* ICONO */}
                        <div className="flex min-w-0 flex-col gap-2 md:col-span-2">

                            <label className="font-semibold text-gray-700">
                                {t('categories.icon')}
                            </label>

                            <input
                                type="text"
                                value={icono}
                                onChange={(e) =>
                                    setIcono(e.target.value)
                                }
                                placeholder={t('categories.iconPlaceholder')}
                                disabled={procesando}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400 disabled:bg-gray-100"
                            />

                        </div>

                    </div>

                    {/* BOTONES */}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                        <button
                            type="submit"
                            disabled={procesando}
                            className="w-full rounded-lg bg-[#123B8F] px-5 py-3 font-semibold text-white transition hover:-translate-y-px hover:bg-[#0B2E6B] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {procesando
                                ? t('categories.saving')
                                : editandoId
                                    ? t('common.actualizar')
                                    : t('categories.create')}
                        </button>

                        {editandoId && (
                            <button
                                type="button"
                                onClick={limpiarFormulario}
                                disabled={procesando}
                                className="w-full rounded-lg bg-slate-100 px-5 py-3 font-semibold text-slate-700 transition hover:-translate-y-px hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                {t('common.cancelar')}
                            </button>
                        )}

                    </div>

                </form>

            </section>

            {/* CATEGORÍAS REGISTRADAS */}
            <section className={CLASE_TARJETA}>

                <EncabezadoSeccion
                    Icono={Tags}
                    tono="azul"
                    titulo={t('categories.registered')}
                    subtitulo={t('categories.available')}
                    extra={
                        <button
                            onClick={cargarCategorias}
                            disabled={cargando || procesando}
                            className="w-full rounded-lg bg-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:-translate-y-px hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {cargando
                                ? t('common.cargando')
                                : t('common.actualizar')}
                        </button>
                    }
                />

                {cargando ? (

                    <Loading mensaje={t('common.cargando')} />

                ) : categorias.length === 0 ? (

                    <EstadoVacio
                        Icono={Tags}
                        texto={`${t('categories.empty')} ${t('categories.emptyHint')}`}
                        className="py-8"
                    />

                ) : (

                    <div className="w-full overflow-x-auto">

                        <table className="w-full min-w-[650px] border-collapse">

                            <thead>
                                <tr>

                                    <th className={`${CLASE_TH} px-3 py-3 sm:px-3.5`}>
                                        {t('categories.name')}
                                    </th>

                                    <th className={`${CLASE_TH} px-3 py-3 sm:px-3.5`}>
                                        {t('categories.type')}
                                    </th>

                                    <th className={`${CLASE_TH} px-3 py-3 sm:px-3.5`}>
                                        {t('categories.icon')}
                                    </th>

                                    <th className={`${CLASE_TH} px-3 py-3 sm:px-3.5`}>
                                        {t('common.acciones')}
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {categorias.map((categoria) => (

                                    <tr
                                        key={categoria.idCategoria}
                                        className="transition hover:bg-gray-50"
                                    >

                                        {/* NOMBRE */}
                                        <td className="border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">
                                            {traducirNombreCategoria(categoria.nombre)}
                                        </td>

                                        {/* TIPO */}
                                        <td className="border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">

                                            <span
                                                className={
                                                    categoria.tipo === 'Ingreso'
                                                        ? 'inline-block whitespace-nowrap rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700 sm:text-sm'
                                                        : 'inline-block whitespace-nowrap rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600 sm:text-sm'
                                                }
                                            >
                                                {categoria.tipo === 'Ingreso' ? t('nav.ingresos') : t('nav.gastos')}
                                            </span>

                                        </td>

                                        {/* ICONO */}
                                        <td className="border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">
                                            {categoria.icono ? (
                                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-3xl leading-none">
                                                    {categoria.icono}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>

                                        {/* ACCIONES */}
                                        <td className="border-b border-gray-200 px-3 py-3.5 text-sm sm:px-3.5">

                                            <div className="flex flex-col gap-2 sm:flex-row">

                                                <button
                                                    onClick={() =>
                                                        editarCategoria(
                                                            categoria
                                                        )
                                                    }
                                                    disabled={procesando}
                                                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-50 ${TONOS.ambar}`}
                                                >
                                                    {t('common.editar')}
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        eliminarCategoria(
                                                            categoria.idCategoria
                                                        )
                                                    }
                                                    disabled={procesando}
                                                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 ${TONOS.rojo}`}
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
                onConfirmar={confirmarEliminarCategoria}
                onCancelar={() => setConfirmModal({ abierto: false, id: null, titulo: '', mensaje: '' })}
            />

        </div>
    )
}
