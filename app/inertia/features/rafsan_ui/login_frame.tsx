import { useEffect, useState, type ReactNode } from 'react'
import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import Icon from '../../components/icon'

export default function RafsanLoginFrame({
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
  const [playVideo, setPlayVideo] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData
    setPlayVideo(!reducedMotion && !saveData)
  }, [])

  return (
    <div className={`rafsan-login-shell ${signup ? 'rafsan-signup-shell' : ''}`}>
      <Head title={signup ? 'Create account' : 'Log in'} />

      <aside className="hero rafsan-login-media">
        {playVideo && !videoFailed ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/media/home-field-sunset.jpg"
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
          >
            <source src="/media/home-field-sunset.mp4" type="video/mp4" />
          </video>
        ) : (
          <img src="/media/home-field-sunset.jpg" alt="" aria-hidden="true" />
        )}

        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content rafsan-login-media-content">
          <span className="badge badge-success badge-soft">
            <Icon name="satellite" size={15} /> NASA POWER CLIMATE DATA
          </span>
          <p className="rafsan-login-kicker">YOUR FARM, KEPT TOGETHER</p>
          <h2>
            Your land.
            <br />
            Your next season.
          </h2>
          <p>Return to saved fields, climate history and transparent crop-rotation guidance.</p>
        </div>
      </aside>

      <main className="card rafsan-login-panel">
        <div className="card-body">
          <p className="rafsan-login-kicker">
            <Icon name="sprout" size={17} />{' '}
            {signup ? 'CREATE YOUR FARM WORKSPACE' : 'SECURE FARM WORKSPACE'}
          </p>
          <h1 className="card-title">{title}</h1>
          <p className="rafsan-login-description">{description}</p>
          {children}
          <p className="rafsan-login-switch">
            {signup ? 'Already growing with us?' : 'New to OrbitAgro?'}{' '}
            <Link href={signup ? '/login' : '/signup'}>
              {signup ? 'Log in' : 'Create an account'} <Icon name="arrow" size={14} />
            </Link>
          </p>
          <p className="rafsan-login-privacy">
            <Icon name="shield" size={15} /> Your farm records stay linked to your account.
          </p>
        </div>
      </main>
    </div>
  )
}
