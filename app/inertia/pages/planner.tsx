import { Head } from '@inertiajs/react'
import DataBrowser from '../components/data_browser'
import type { InertiaProps } from '../types'

export default function Planner({ user }: InertiaProps) {
  return (
    <div className="site-page planner-page space-y-5">
      <Head title="Crop planner" />
      <h1 className="text-3xl font-semibold tracking-tight">Crop planner</h1>
      <DataBrowser signedIn={Boolean(user)} />
    </div>
  )
}
