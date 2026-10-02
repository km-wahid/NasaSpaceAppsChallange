import { Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { ReactElement, useEffect } from 'react'
import { Form, Link } from '@adonisjs/inertia/react'
import Icon from '../components/icon'

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  useEffect(() => {
    toast.dismiss()
  }, [usePage().url])

  if (children.props.flash.error) {
    toast.error(children.props.flash.error)
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar" aria-label="Main navigation">
        <Link route="home" className="sidebar-brand">
          <span className="brand-symbol">
            <Icon name="leaf" size={26} />
          </span>
          <span>
            orbit<span className="brand-subtitle">AGRICULTURE INTELLIGENCE</span>
          </span>
        </Link>
        <span className="nav-section-label">WORKSPACE</span>
        <nav className="sidebar-nav">
          <a href="/#overview">
            <Icon name="grid" />
            Overview
          </a>
          <a href="/#crop-library">
            <Icon name="leaf" />
            Crop library
          </a>
          <a href={children.props.user ? '/#farm-workspace' : '/login'}>
            <Icon name="layers" />
            My farms
          </a>
          <a href="/#data-sources">
            <Icon name="globe" />
            Data & sources
          </a>
        </nav>
        <div className="sidebar-note">
          <span className="orbit-mark">
            <Icon name="globe" size={28} />
          </span>
          <h3>
            A wider view.
            <br />A better season.
          </h3>
          <p>Earth observations meet local agricultural knowledge.</p>
          <span className="sidebar-tag">NASA SPACE APPS</span>
        </div>
        <div className="sidebar-footer">
          <span className="status-dot" />
          Transparent by design<small>Deterministic rotation planning</small>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div>
            <div>
              <Link route="home" className="breadcrumb">
                <span>Workspace</span>
                <Icon name="chevron" size={14} />
                <strong>Crop Rotation Lab</strong>
              </Link>
            </div>
            <div>
              <nav>
                {children.props.user ? (
                  <>
                    <span className="user-avatar">{children.props.user.initials}</span>
                    <Form route="session.destroy">
                      <button type="submit"> Logout </button>
                    </Form>
                  </>
                ) : (
                  <>
                    <Link route="new_account.create" className="header-cta">
                      Create account
                      <Icon name="arrow" size={16} />
                    </Link>
                    <Link route="session.create">Login</Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>
        <main id="main-content">{children}</main>
        <footer className="app-footer">
          <span>ORBIT · NASA Space Apps Challenge</span>
          <span>Built for informed farming decisions</span>
        </footer>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  )
}
