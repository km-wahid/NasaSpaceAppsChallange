import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import Icon from '../../components/icon'

export default function NotFound() {
  return (
    <div className="site-page text-center py-20">
      <Head title="Page not found" />
      <span className="agri-icon-box mx-auto">
        <Icon name="map" size={28} />
      </span>
      <p className="agri-eyebrow mt-6 justify-center text-primary">A SMALL DETOUR</p>
      <h1 className="mt-3 text-4xl font-semibold">This page isn’t on the map.</h1>
      <p className="my-5 text-base-content/70">Let’s get you back to your growing plans.</p>
      <Link href="/" className="btn btn-neutral rounded-full">
        Back to home <Icon name="arrow" size={18} />
      </Link>
    </div>
  )
}
