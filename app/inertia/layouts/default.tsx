import { Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { ReactElement, useEffect, useState } from 'react'
import { Form, Link as NavigationLink } from '@adonisjs/inertia/react'
import Icon from '../components/icon'
import { useLocale } from '../lib/i18n'

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  const { url } = usePage()
  const { locale, setLocale, t } = useLocale()
  const [menuOpen, setMenuOpen] = useState(false)
  const user = children.props.user
  const path = url.split(/[?#]/)[0]
  const publicNavigation = [
    { href: '/mission', label: t('navMission') },
    { href: '/explorer', label: t('navExplorer') },
    { href: '/planner', label: t('navPlanner') },
    { href: '/compare', label: t('navCompare') },
  ]
  const navigation = user
    ? [
        { href: '/farms', label: t('navFarmWorkspace') },
        ...publicNavigation,
        { href: '/explorer/map', label: t('navMap') },
      ]
    : publicNavigation

  useEffect(() => {
    toast.dismiss()
    setMenuOpen(false)
  }, [url])

  useEffect(() => {
    if (children.props.flash.error) toast.error(children.props.flash.error)
  }, [children.props.flash.error])

  return (
    <div className={`oa-shell ${path === '/explorer/map' ? 'oa-shell-map' : ''}`}>
      <a className="oa-skip-link" href="#main-content">
        {t('skip')}
      </a>
      <header className={`oa-header oa-header-home ${path === '/' ? '' : 'oa-header-inner'}`}>
        <div className="navbar oa-navbar">
          <div className="navbar-start min-w-0">
            <NavigationLink href="/" className="oa-brand" aria-label="OrbitAgro">
              <span className="oa-brand-mark">
                <Icon name="globe" size={21} />
              </span>
              <span className="min-w-0">
                <strong>OrbitAgro</strong>
                <small>{t('brandTagline')}</small>
              </span>
            </NavigationLink>
            <span className="badge badge-success badge-soft oa-live-badge">
              <span className="status status-success" /> {t('liveRegion')}
            </span>
          </div>
          <nav className="navbar-center oa-desktop-nav" aria-label="Main navigation">
            <ul className="menu menu-horizontal menu-sm">
              {navigation.map((item) => (
                <li key={item.href}>
                  <NavigationLink
                    href={item.href}
                    className={path === item.href ? 'menu-active' : ''}
                    aria-current={path === item.href ? 'page' : undefined}
                  >
                    {item.label}
                  </NavigationLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="navbar-end gap-2">
            <label className="oa-locale-select">
              <span className="sr-only">{t('language')}</span>
              <select
                className="select select-sm"
                value={locale}
                onChange={(event) => setLocale(event.target.value as 'bn' | 'en')}
                aria-label={t('language')}
              >
                <option value="bn">বাংলা</option>
                <option value="en">EN</option>
              </select>
            </label>
            {user ? (
              <div className="oa-account">
                <span
                  className="avatar avatar-placeholder"
                  aria-label={`${t('signedIn')} ${user.initials}`}
                >
                  <span className="oa-avatar">{user.initials}</span>
                </span>
                <Form route="session.destroy">
                  <button type="submit" className="btn btn-ghost btn-sm oa-account-label">
                    {t('logout')}
                  </button>
                </Form>
              </div>
            ) : (
              <div className="oa-account-actions">
                <NavigationLink href="/login" className="btn btn-ghost btn-sm">
                  {t('login')}
                </NavigationLink>
                <NavigationLink href="/signup" className="btn btn-primary btn-sm">
                  {t('signup')}
                </NavigationLink>
              </div>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-square btn-sm oa-menu-toggle"
              aria-label={menuOpen ? t('menuClose') : t('menuOpen')}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d={menuOpen ? 'm6 6 12 12 M6 18 18 6' : 'M4 6h16 M4 12h16 M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="mobile-navigation" className="oa-mobile-nav" aria-label="Mobile navigation">
            <ul className="menu menu-lg w-full">
              {navigation.map((item) => (
                <li key={item.href}>
                  <NavigationLink
                    href={item.href}
                    className={path === item.href ? 'menu-active' : ''}
                  >
                    {item.label}
                    <Icon name="arrow" size={16} />
                  </NavigationLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main id="main-content" className="oa-main">
        {children}
      </main>
      {path !== '/explorer/map' && (
        <footer className="footer sm:footer-horizontal oa-footer">
          <aside>
            <NavigationLink href="/" className="oa-brand oa-brand-footer">
              <span className="oa-brand-mark">
                <Icon name="globe" size={21} />
              </span>
              <span>
                <strong>OrbitAgro</strong>
                <small>{t('brandTagline')}</small>
              </span>
            </NavigationLink>
            <p>{t('footerLine')}</p>
          </aside>
          <nav>
            <h2 className="footer-title">OrbitAgro</h2>
            <NavigationLink href="/mission">{t('navMission')}</NavigationLink>
            <NavigationLink href="/explorer">{t('navExplorer')}</NavigationLink>
            <NavigationLink href="/planner">{t('navPlanner')}</NavigationLink>
          </nav>
          <aside className="oa-footer-note">
            <Icon name="shield" size={20} />
            <span>{t('footerNote')}</span>
          </aside>
        </footer>
      )}
      <Toaster position="top-center" richColors />
    </div>
  )
}
