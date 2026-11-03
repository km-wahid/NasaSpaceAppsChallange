import type { ReactNode } from 'react'
import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
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
          <h2>Your farm. Your plan.</h2>
        </div>
      </aside>
      <div className="auth-card">
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
        <p className="auth-switch">
          {signup ? 'Already growing with us?' : 'New to Orbit?'}{' '}
          <Link href={signup ? '/login' : '/signup'}>
            {signup ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </div>
  )
}
