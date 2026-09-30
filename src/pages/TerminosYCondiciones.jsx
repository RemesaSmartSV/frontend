import PoliticaLayout from '../components/PoliticaLayout'

export default function TerminosYCondiciones() {
    return (
        <PoliticaLayout
            titulo="Términos y condiciones"
            actualizado="30 de septiembre de 2026"
        >
            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    1. Aceptación
                </h2>
                <p>
                    Al crear una cuenta o usar RemesaSmart SV aceptas estos
                    términos. Si no estás de acuerdo, no uses la aplicación.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    2. Qué es y qué no es esta aplicación
                </h2>
                <p>
                    RemesaSmart SV es una herramienta de organización
                    financiera familiar: permite registrar movimientos,
                    definir presupuestos, guardar metas de ahorro y consultar
                    resúmenes.
                </p>
                <p>
                    <strong>No es un servicio financiero.</strong> No procesa
                    pagos, no transfiere dinero, no administra cuentas
                    bancarias y no ofrece asesoría financiera, fiscal ni de
                    inversión. Los cálculos que muestra son informativos y se
                    basan únicamente en los datos que tú registras.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    3. Tu cuenta
                </h2>
                <ul className="list-disc space-y-1 pl-6">
                    <li>
                        Eres responsable de mantener la confidencialidad de tu
                        contraseña.
                    </li>
                    <li>
                        Debes proporcionar información veraz y mantenerla
                        actualizada.
                    </li>
                    <li>
                        La cuenta es personal: compartirla puede exponer la
                        información financiera de tu hogar.
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    4. Uso aceptable
                </h2>
                <p>No está permitido:</p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>Intentar acceder a los datos de otro hogar.</li>
                    <li>Interferir con el funcionamiento de la aplicación.</li>
                    <li>Usarla con fines ilícitos o para suplantar a otros.</li>
                    <li>Revertir medidas de seguridad o automatizar abusos.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    5. Disponibilidad
                </h2>
                <p>
                    La aplicación se ofrece tal cual. Puede haber interrupciones
                    por mantenimiento, errores o causas fuera de nuestro
                    control. Trabajamos para mantenerla estable, pero no
                    garantizamos disponibilidad continua ni ausencia total de
                    errores.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    6. Responsabilidad
                </h2>
                <p>
                    Las decisiones financieras que tomes a partir de la
                    información registrada son tuyas. En la medida en que lo
                    permita la legislación aplicable, el equipo responsable no
                    responde por daños derivados del uso o la imposibilidad de
                    usar la aplicación.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    7. Terminación
                </h2>
                <p>
                    Puedes dejar de usar la aplicación en cualquier momento y
                    solicitar la eliminación de tu cuenta y de los datos de tu
                    hogar. Podemos suspender cuentas que violen estos términos.
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    8. Cambios y contacto
                </h2>
                <p>
                    Estos términos pueden actualizarse; la fecha de la última
                    modificación aparece al principio del documento.{' '}
                    <strong>
                        Pendiente de completar por el equipo: canal de contacto
                        del responsable.
                    </strong>
                </p>
            </section>
        </PoliticaLayout>
    )
}
