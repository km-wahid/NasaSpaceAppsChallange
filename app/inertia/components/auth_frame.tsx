import type { ReactNode } from 'react'
import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import Icon from './icon'
import landscape from '../assets/farm-landscape.jpg'

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
        <img src={landscape} alt="Open green farmland in soft evening light" />
        <div>
          <Icon name="leaf" size={36} />
          <p className="agri-eyebrow">A LITTLE PERSPECTIVE GOES A LONG WAY</p>
          <h2>
            Your field.
            <br />
            Your future.
          </h2>
          <p>
            Keep your farm information together. Make room for a more thoughtful growing season.
          </p>
        </div>
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
