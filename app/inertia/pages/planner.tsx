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
      <div className="oa-page-header">
        <div>
          <p className="oa-kicker">
            <Icon name="sprout" size={18} /> {t('plannerEyebrow')}
          </p>
          <h1>{t('plannerTitle')}</h1>
          <p>{t('plannerBody')}</p>
        </div>
        <span className="badge badge-info badge-soft">
          <Icon name="shield" size={15} /> DETERMINISTIC
        </span>
      </div>
      <ol className="steps steps-horizontal oa-planner-steps" aria-label="Planning journey">
        <li className="step step-primary">{t('selectDistrict')}</li>
        <li className="step">{t('soilWater')}</li>
        <li className="step">{t('navCompare')}</li>
      </ol>
      <DataBrowser signedIn={Boolean(user)} />
    </div>
  )
}
