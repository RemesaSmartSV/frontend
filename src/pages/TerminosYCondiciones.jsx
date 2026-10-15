import PoliticaLayout from '../components/PoliticaLayout'
import { useTranslation } from 'react-i18next'

export default function TerminosYCondiciones() {
    const { t } = useTranslation()
    return (
        <PoliticaLayout
            titulo={t('legal.terms.title')}
            actualizado="2026-09-30"
        >
            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.terms.s1')}
                </h2>
                <p>
                    {t('legal.terms.p1')}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.terms.s2')}
                </h2>
                <p>
                    {t('legal.terms.p2')}
                </p>
                <p>
                    <strong>{t('legal.terms.notFinancialService')}</strong> {t('legal.terms.p3')}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.terms.s3')}
                </h2>
                <ul className="list-disc space-y-1 pl-6">
                    <li>
                        {t('legal.terms.account1')}
                    </li>
                    <li>
                        {t('legal.terms.account2')}
                    </li>
                    <li>
                        {t('legal.terms.account3')}
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.terms.s4')}
                </h2>
                <p>{t('legal.terms.notAllowed')}</p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>{t('legal.terms.prohibited1')}</li>
                    <li>{t('legal.terms.prohibited2')}</li>
                    <li>{t('legal.terms.prohibited3')}</li>
                    <li>{t('legal.terms.prohibited4')}</li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.terms.s5')}
                </h2>
                <p>
                    {t('legal.terms.p5')}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.terms.s6')}
                </h2>
                <p>
                    {t('legal.terms.p6')}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.terms.s7')}
                </h2>
                <p>
                    {t('legal.terms.p7')}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.terms.s8')}
                </h2>
                <p>
                    {t('legal.terms.p8')}{' '}
                    <strong>
                        {t('legal.terms.pendingContact')}
                    </strong>
                </p>
            </section>
        </PoliticaLayout>
    )
}
