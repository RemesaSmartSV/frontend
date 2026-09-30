import PoliticaLayout from '../components/PoliticaLayout'

export default function PoliticaPrivacidad() {
    return (
        <PoliticaLayout
            titulo="Política de privacidad"
            actualizado="30 de septiembre de 2026"
        >
            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    1. Quién trata tus datos
                </h2>
                <p>
                    RemesaSmart SV es una aplicación de gestión financiera
                    familiar. El responsable del tratamiento de los datos es el
                    equipo que mantiene esta aplicación.{' '}
                    <strong>
                        Pendiente de completar por el equipo: nombre completo
                        del responsable y canal de contacto antes de publicar.
                    </strong>
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    2. Qué datos recopilamos
                </h2>
                <p>La aplicación almacena únicamente los datos que tú introduces:</p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>
                        <strong>De la cuenta:</strong> nombre, correo
                        electrónico, contraseña y el nombre del hogar.
                    </li>
                    <li>
                        <strong>Financieros:</strong> movimientos (monto, fecha,
                        tipo, descripción y origen), categorías, presupuestos,
                        metas de ahorro, aportes a metas y notas de educación
                        financiera que registres.
                    </li>
                    <li>
                        <strong>Técnicos:</strong> un token de sesión y la
                        información básica de tu usuario guardados en el
                        almacenamiento local de tu navegador.
                    </li>
                </ul>
                <p>
                    No pedimos datos de tarjetas, cuentas bancarias, documentos
                    de identidad ni ubicación. La aplicación no procesa pagos
                    ni realiza transferencias.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    3. Cómo se protegen
                </h2>
                <ul className="list-disc space-y-1 pl-6">
                    <li>
                        La contraseña <strong>no se guarda en claro</strong>:
                        se almacena como hash con un algoritmo estándar de la
                        industria, por lo que no puede recuperarse desde la base
                        de datos.
                    </li>
                    <li>
                        El acceso a las secciones protegidas requiere un token
                        de sesión firmado que caduca automáticamente.
                    </li>
                    <li>
                        Cada hogar solo ve sus propios datos: las consultas se
                        filtran por el hogar del usuario autenticado.
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    4. Para qué usamos los datos
                </h2>
                <p>
                    Exclusivamente para prestar el servicio: calcular el
                    resumen del tablero, mostrar tus movimientos y
                    presupuestos, generar alertas de presupuesto y mantener tu
                    sesión iniciada. No usamos los datos para publicidad, no
                    los vendemos y no los cedemos a terceros.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    5. Dónde se almacenan
                </h2>
                <p>
                    En la base de datos PostgreSQL del servidor donde se
                    despliega la aplicación. No se copian a servicios externos
                    ni a herramientas de analítica de terceros.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    6. Tus derechos
                </h2>
                <p>
                    Puedes solicitar acceso, rectificación o eliminación de tus
                    datos en cualquier momento. Puedes cerrar la sesión desde
                    la aplicación y borrar el almacenamiento local desde la
                    configuración de tu navegador. Para ejercer los derechos
                    anteriores, contacta al equipo responsable por el canal que
                    se indique en esta página.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    7. Cambios en esta política
                </h2>
                <p>
                    Si cambiamos cómo tratamos los datos, actualizaremos esta
                    página y la fecha de la última modificación aparecerá al
                    principio del documento.
                </p>
            </section>
        </PoliticaLayout>
    )
}
