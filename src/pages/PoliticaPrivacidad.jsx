import PoliticaLayout from '../components/PoliticaLayout'
import { useTranslation } from 'react-i18next'

export default function PoliticaPrivacidad() {
    const { t } = useTranslation()
    return (
        <PoliticaLayout
            titulo={t('legal.privacy.title')}
            actualizado="2026-09-30"
        >
            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.privacy.s1')}
                </h2>
                <p>
                    {t('legal.privacy.p1')}{' '}
                    <strong>
                        {t('legal.privacy.pendingContact')}
                    </strong>
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.privacy.s2')}
                </h2>
                <p>{t('legal.privacy.p2')}</p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>
                        <strong>{t('legal.privacy.accountLabel')}</strong> {t('legal.privacy.accountData')}
                    </li>
                    <li>
                        <strong>{t('legal.privacy.financialLabel')}</strong> {t('legal.privacy.financialData')}
                    </li>
                    <li>
                        <strong>{t('legal.privacy.technicalLabel')}</strong> {t('legal.privacy.technicalData')}
                    </li>
                </ul>
                <p>
                    {t('legal.privacy.p3')}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.privacy.s3')}
                </h2>
                <ul className="list-disc space-y-1 pl-6">
                    <li>
                        {t('legal.privacy.passwordProtection')}
                    </li>
                    <li>
                        {t('legal.privacy.sessionProtection')}
                    </li>
                    <li>
                        {t('legal.privacy.householdProtection')}
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.privacy.s4')}
                </h2>
                <p>
                    {t('legal.privacy.p4')}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.privacy.s5')}
                </h2>
                <p>
                    {t('legal.privacy.p5')}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.privacy.s6')}
                </h2>
                <p>
                    {t('legal.privacy.p6')}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.privacy.s7')}
                </h2>
                <p>
                    {t('legal.privacy.p7')}
                </p>
            </section>
        </PoliticaLayout>
    )
}
