import { Head } from '@inertiajs/react'
import DataBrowser from '../components/data_browser'
import Icon from '../components/icon'
import { useLocale } from '../lib/i18n'

export default function Dashboard() {
  const { t } = useLocale()
  return (
    <div className="oa-app-page">
      <Head title={t('dashboardTitle')} />
      <header className="oa-page-header">
        <div>
          <p className="oa-kicker">
            <Icon name="grid" size={18} /> {t('navDashboard')}
          </p>
          <h1>{t('dashboardTitle')}</h1>
          <p>{t('dashboardBody')}</p>
        </div>
        <span className="badge badge-success badge-soft">
          <span className="status status-success" /> NASA POWER CACHE
        </span>
      </header>
      <DataBrowser signedIn />
    </div>
  )
}
