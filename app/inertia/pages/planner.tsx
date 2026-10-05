import { Head } from '@inertiajs/react'
import DataBrowser from '../components/data_browser'
import type { InertiaProps } from '../types'

export default function Planner({ user }: InertiaProps) {
  return (
    <div className="site-page planner-page">
      <Head title="Crop rotation recommendations" />
      <div className="site-page-heading planner-heading">
        <p className="agri-eyebrow text-primary">YOUR FIELD. YOUR FUTURE.</p>
        <h1>Find your next crop rotation.</h1>
        <p>
          Tell us about your farm. Compare suitable crop sequences, see when to plant, and save the
          plan you want to use.
        </p>
      </div>
      <ol className="planner-journey" aria-label="Planning journey">
        <li>
          <span>01</span> Find your district
        </li>
        <li>
          <span>02</span> Set up your farm
        </li>
        <li>
          <span>03</span> Choose your rotation
        </li>
      </ol>
      <DataBrowser signedIn={Boolean(user)} />
    </div>
  )
}
