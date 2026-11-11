import type { ReactNode } from 'react'
import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import Icon from './icon'

export default function AuthFrame({
  title,
  description,
  children,
  signup = false,
}: {
  title: string
  description: string
  children: ReactNode
  signup?: boolean
}) {
  return (
    <div className="auth-page">
      <Head title={signup ? 'Create account' : 'Log in'} />
      <aside className="auth-landscape">
        <img src="/media/home-field-sunset.jpg" alt="" aria-hidden="true" />
        <div className="auth-landscape-content">
          <span className="badge badge-success badge-soft">
            <Icon name="satellite" size={15} /> NASA POWER CLIMATE DATA
          </span>
          <p className="auth-landscape-kicker">YOUR FARM, KEPT TOGETHER</p>
          <h2>
            Your land.
            <br />
            Your next season.
          </h2>
          <p>Return to saved fields, climate history and transparent crop-rotation guidance.</p>
          <div className="auth-landscape-note">
            <Icon name="shield" size={17} /> Stored securely. Decisions stay with the farmer.
          </div>
        </div>
      </aside>
      <main className="card auth-card">
        <div className="card-body auth-card-body">
          <p className="auth-card-kicker">
            <Icon name="sprout" size={17} /> SECURE FARM WORKSPACE
          </p>
          <h1>{title}</h1>
          <p className="auth-description">{description}</p>
          {children}
          <p className="auth-switch">
            {signup ? 'Already growing with us?' : 'New to OrbitAgro?'}{' '}
            <Link href={signup ? '/login' : '/signup'}>
              {signup ? 'Log in' : 'Create an account'} <Icon name="arrow" size={14} />
            </Link>
          </p>
          <p className="auth-privacy">
            <Icon name="shield" size={15} /> Your farm records stay linked to your account.
          </p>
        </div>
      </main>
    </div>
  )
}
