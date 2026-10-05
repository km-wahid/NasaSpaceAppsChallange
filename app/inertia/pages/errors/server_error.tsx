import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import Icon from '../../components/icon'

export default function ServerError() {
  return (
    <div className="site-page text-center py-20">
      <Head title="Temporarily unavailable" />
      <span className="agri-icon-box mx-auto">
        <Icon name="refresh" size={28} />
      </span>
      <p className="agri-eyebrow mt-6 justify-center text-primary">A MOMENT TO REGROUP</p>
      <h1 className="mt-3 text-4xl font-semibold">We couldn’t load this page.</h1>
      <p className="my-5 text-base-content/70">
        Please try again in a moment. Your saved farm information has not been changed by this page
        request.
      </p>
      <Link href="/" className="btn btn-neutral rounded-full">
        Back to home <Icon name="arrow" size={18} />
      </Link>
    </div>
  )
}
