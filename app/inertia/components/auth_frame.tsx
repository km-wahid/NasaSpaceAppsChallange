import type { ReactNode } from 'react'
import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import Icon from './icon'
import FarmScene from './farm_scene'

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
        <div>
          <Icon name="leaf" size={36} />
          <p className="agri-eyebrow">YOUR FARM, KEPT TOGETHER</p>
          <h2>
            Your field.
            <br />
            Your future.
          </h2>
          <p>Save your farm. Return to your plan anytime.</p>
        </div>
        <FarmScene scene="auth" />
      </aside>
      <div className="auth-card">
        <span className="agri-icon-box">
          <Icon name="leaf" size={25} />
        </span>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
        <p className="auth-switch">
          {signup ? 'Already growing with us?' : 'New to Orbit?'}{' '}
          <Link href={signup ? '/login' : '/signup'}>
            {signup ? 'Log in' : 'Create an account'} <Icon name="arrow" size={14} />
          </Link>
        </p>
        <p className="auth-privacy">
          <Icon name="shield" size={15} /> Your farm records stay linked to your account.
        </p>
      </div>
    </div>
  )
}
