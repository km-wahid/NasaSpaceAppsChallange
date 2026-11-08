import { Head } from '@inertiajs/react'
import DataBrowser from '../components/data_browser'
import type { InertiaProps } from '../types'
import Icon from '../components/icon'
import { useLocale } from '../lib/i18n'

export default function Planner({ user }: InertiaProps) {
  const { t } = useLocale()
  return (
    <div className="oa-app-page oa-planner-page">
      <Head title={t('plannerTitle')} />
      <header className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-2 p-6 sm:p-8">
          <p className="oa-kicker m-0">
            <Icon name="sprout" size={18} /> {t('plannerEyebrow')}
          </p>
          <h1 className="m-0 max-w-3xl text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
            {t('plannerTitle')}
          </h1>
        </div>
      </header>
      <DataBrowser signedIn={Boolean(user)} showJourney />
    </div>
  )
}
