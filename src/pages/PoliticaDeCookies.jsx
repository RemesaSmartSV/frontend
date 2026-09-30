import PoliticaLayout from '../components/PoliticaLayout'

export default function PoliticaDeCookies() {
    return (
        <PoliticaLayout
            titulo="Política de cookies"
            actualizado="30 de septiembre de 2026"
        >
            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    1. Resumen
                </h2>
                <p>
                    RemesaSmart SV <strong>no utiliza cookies</strong> propias
                    ni de terceros. No hay cookies publicitarias, ni de
                    analítica, ni de redes sociales, y por eso la aplicación no
                    muestra un banner de consentimiento: no hay nada que
                    consentir.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    2. Cómo se guarda tu sesión
                </h2>
                <p>
                    En lugar de cookies, la aplicación usa el{' '}
                    <strong>almacenamiento local del navegador</strong>{' '}
                    (<code className="rounded bg-gray-100 px-1">localStorage</code>
                    ), que es información que solo vive en tu equipo y solo
                    esta aplicación puede leer desde el mismo origen:
                </p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>
                        <code className="rounded bg-gray-100 px-1">token</code>
                        : el token de sesión que caduca a las 8 horas.
                    </li>
                    <li>
                        <code className="rounded bg-gray-100 px-1">
                            usuario
                        </code>
                        : los datos básicos de tu cuenta para no pedirte el
                        inicio de sesión en cada visita.
                    </li>
                </ul>
                <p>
                    Al cerrar la sesión, la aplicación borra ambas entradas.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    3. Herramientas de terceros
                </h2>
                <p>
                    No incorporamos Google Analytics, Google Tag Manager,
                    píxeles de publicidad, heatmaps ni widgets sociales. Las
                    únicas solicitudes que hace la aplicación van a su propio
                    servidor.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    4. Cómo borrar estos datos
                </h2>
                <p>
                    Puedes eliminar el almacenamiento local en cualquier
                    momento desde la configuración de privacidad de tu
                    navegador o cerrando la sesión desde la aplicación. Al
                    hacerlo, se te pedirá iniciar sesión de nuevo.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    5. Cambios en esta política
                </h2>
                <p>
                    Si en el futuro incorporamos cookies, actualizaremos esta
                    página y pediremos consentimiento antes de instalarlas. La
                    fecha de la última modificación aparece al principio del
                    documento.
                </p>
            </section>
        </PoliticaLayout>
    )
}
