import PoliticaLayout from '../components/PoliticaLayout'
import { useTranslation } from 'react-i18next'

export default function PoliticaDeCookies() {
    const { t } = useTranslation()
    return (
        <PoliticaLayout
            titulo={t('legal.cookies.title')}
            actualizado="2026-09-30"
        >
            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.cookies.s1')}
                </h2>
                <p>
                    {t('legal.cookies.p1')}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.cookies.s2')}
                </h2>
                <p>{t('legal.cookies.p2')}</p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>
                        <code className="rounded bg-gray-100 px-1">token</code>{' '}
                        {t('legal.cookies.token')}
                    </li>
                    <li>
                        <code className="rounded bg-gray-100 px-1">
                            usuario
                        </code>{' '}
                        {t('legal.cookies.user')}
                    </li>
                </ul>
                <p>
                    {t('legal.cookies.p3')}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.cookies.s3')}
                </h2>
                <p>
                    {t('legal.cookies.p4')}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.cookies.s4')}
                </h2>
                <p>
                    {t('legal.cookies.p5')}
                </p>
            </section>

            <section>
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('legal.cookies.s5')}
                </h2>
                <p>
                    {t('legal.cookies.p6')}
                </p>
            </section>
        </PoliticaLayout>
    )
}
