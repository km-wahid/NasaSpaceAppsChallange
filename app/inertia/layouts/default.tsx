import { Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { ReactElement, useEffect, useState } from 'react'
import { Form, Link as NavigationLink } from '@adonisjs/inertia/react'
import Icon from '../components/icon'

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  const { url } = usePage()
  const [menuOpen, setMenuOpen] = useState(false)
  const user = children.props.user
  const path = url.split(/[?#]/)[0]
  const navigation = [
    { href: '/', label: 'Home' },
    { href: '/planner', label: 'Crop planner' },
    { href: '/farms', label: 'My farms' },
    { href: '/sources', label: 'Our data' },
  ]
  useEffect(() => {
    toast.dismiss()
    setMenuOpen(false)
  }, [url])
  useEffect(() => {
    if (children.props.flash.error) toast.error(children.props.flash.error)
  }, [children.props.flash.error])

  return (
    <div className="site-shell bg-base-100 text-base-content">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="site-announcement">
        <Icon name="globe" size={14} />A view from space. A plan for your field.
        <span>NASA Space Apps Challenge</span>
      </div>
      <header className="site-header">
        <div className="navbar site-navbar">
          <NavigationLink href="/" className="site-brand" aria-label="Orbit home">
            <span className="site-brand-mark">
              <Icon name="leaf" size={27} />
            </span>
            <span>
              orbit<span className="site-brand-tagline">GROW WITH PERSPECTIVE</span>
            </span>
          </NavigationLink>
          <nav className="desktop-navigation" aria-label="Main navigation">
            {navigation.map((item) => (
              <NavigationLink
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={path === item.href ? 'page' : undefined}
              >
                {item.label}
              </NavigationLink>
            ))}
          </nav>
          <div className="site-account-actions">
            {user ? (
              <>
                <span className="user-avatar" aria-label={`Signed in as ${user.initials}`}>
                  {user.initials}
                </span>
                <Form route="session.destroy">
                  <button type="submit" className="btn btn-ghost btn-sm">
                    Log out
                  </button>
                </Form>
              </>
            ) : (
              <>
                <NavigationLink href="/login" className="site-login">
                  Log in
                </NavigationLink>
                <NavigationLink href="/signup" className="btn btn-neutral rounded-full">
                  Get started <Icon name="arrow" size={17} />
                </NavigationLink>
              </>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-square mobile-menu-toggle"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
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
          <nav
            id="mobile-navigation"
            className="mobile-navigation"
            aria-label="Mobile navigation"
            onKeyDown={(event) => {
              if (event.key === 'Escape') setMenuOpen(false)
            }}
          >
            {navigation.map((item) => (
              <NavigationLink
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={path === item.href ? 'page' : undefined}
              >
                {item.label}
                <Icon name="arrow" size={16} />
              </NavigationLink>
            ))}
            {!user && (
              <NavigationLink href="/login" onClick={() => setMenuOpen(false)}>
                Log in
                <Icon name="arrow" size={16} />
              </NavigationLink>
            )}
          </nav>
        )}
      </header>
      <main id="main-content" className="site-main">
        {children}
      </main>
      <footer className="site-footer">
        <div className="site-footer-top">
          <div>
            <NavigationLink href="/" className="site-brand">
              <Icon name="leaf" size={28} />
              <span>orbit</span>
            </NavigationLink>
            <p>Thoughtful farming starts with a wider view.</p>
          </div>
          <nav aria-label="Footer navigation">
            <NavigationLink href="/planner">Plan your season</NavigationLink>
            <NavigationLink href="/farms">Your farms</NavigationLink>
            <NavigationLink href="/sources">Data & transparency</NavigationLink>
          </nav>
        </div>
        <div className="site-footer-bottom">
          <span>Orbit · NASA Space Apps Challenge</span>
          <span>Decision support. Your farm, your decision.</span>
        </div>
      </footer>
      <Toaster position="top-center" richColors />
    </div>
  )
}
