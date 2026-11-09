import { useState, useEffect } from 'react'
import { Link } from '@adonisjs/inertia/react'
import Logo from './logo'
import { useLocale } from '../lib/i18n'
import AccountMenu from './account_menu'
import { Search, Globe, User, ChevronDown } from 'lucide-react'

interface NavbarProps {
  currentPath: string
  user?: {
    email: string
    initials: string
  } | null
  onOpenCommandPalette?: () => void
}

export default function Navbar({ currentPath, user, onOpenCommandPalette }: NavbarProps) {
  const { locale, setLocale, t } = useLocale()
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isMobileScreen, setIsMobileScreen] = useState(false)

  // Track screen size for responsive account menu display
  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Scroll detection: shrink and hide on scroll down / show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > 30) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }

      if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        // Scrolling down -> hide navbar
        setVisible(false)
        setIsAccountOpen(false)
      } else {
        // Scrolling up -> show navbar
        setVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close account menu on route change
  useEffect(() => {
    setIsAccountOpen(false)
  }, [currentPath])

  const navLinks = [
    { href: '/mission', label: t('navMission') || 'Mission' },
    { href: '/explorer', label: 'EO' },
    { href: '/compare', label: t('navCompare') || 'Compare' },
    { href: '/farms', label: 'Farm' },
  ]

  const isCurrent = (href: string) => {
    if (href === '/') return currentPath === '/'
    return currentPath.startsWith(href)
  }

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[760px] transition-all duration-300 ease-out hidden md:block ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'
      }`}
    >
      <nav
        className={`bg-white/95 backdrop-blur-md rounded-full border border-slate-200/90 flex items-center justify-between transition-all duration-200 ${
          scrolled ? 'py-1.5 px-3 shadow-lg' : 'py-2 px-3.5 shadow-md'
        }`}
        aria-label="Main Navigation"
      >
        {/* Left: Brand Logo (Leaf icon + OrbitAgro) */}
        <Logo size="sm" showSubtitle={false} href="/" className="mr-1 flex-shrink-0" />

        {/* Center: Clean links with animated rounded pill */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/60">
          {navLinks.map((link) => {
            const active = isCurrent(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 select-none ${
                  active
                    ? 'bg-[#15803d] text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right side: Search, Language, Account (Deep green default, pure white icon/text; hover white with black) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Guest CTA buttons on landing/unauthenticated page */}
          {!user && (
            <div className="flex items-center gap-1.5 mr-0.5">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors"
              >
                {t('login') || 'Log in'}
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 text-xs font-bold bg-[#15803d] text-white hover:bg-[#166534] rounded-full shadow-xs transition-transform active:scale-95 hidden sm:inline-flex"
              >
                {t('signup') || 'Get started'}
              </Link>
            </div>
          )}

          {/* 1. Search button (40x40, Deep green circle, white icon; on hover white background, black icon) */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="group nav-pill-btn flex items-center justify-center w-10 h-10 rounded-full bg-[#15803d] text-white hover:bg-white hover:text-black border border-[#166534] hover:border-slate-300 shadow-xs transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d]"
              title="Search (Ctrl + K)"
              aria-label="Open search dialog"
            >
              <Search className="w-[18px] h-[18px] text-white stroke-white group-hover:text-black group-hover:stroke-black transition-colors duration-200" />
            </button>
          )}

          {/* 2. Language button (Deep green pill, white globe & text; on hover white background, black globe & text) */}
          <button
            type="button"
            onClick={() => setLocale(locale === 'bn' ? 'en' : 'bn')}
            className="group nav-pill-btn flex items-center justify-center h-10 px-3.5 rounded-full bg-[#15803d] text-white hover:bg-white hover:text-black border border-[#166534] hover:border-slate-300 shadow-xs transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d] gap-1.5 text-xs font-bold select-none"
            title={locale === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
            aria-label="Select language"
          >
            <Globe className="w-4 h-4 text-white stroke-white group-hover:text-black group-hover:stroke-black transition-colors duration-200 flex-shrink-0" />
            <span className="text-white group-hover:text-black transition-colors duration-200">
              {locale === 'bn' ? 'বাং' : 'EN'}
            </span>
          </button>

          {/* 3. Account button (Deep green circle/pill, white user initials like RR; on hover white background, black RR) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAccountOpen((prev) => !prev)}
              className="group nav-pill-btn flex items-center justify-center h-10 px-3 min-w-10 rounded-full bg-[#15803d] text-white hover:bg-white hover:text-black border border-[#166534] hover:border-slate-300 shadow-xs transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d] gap-1 text-xs font-bold uppercase tracking-tight select-none"
              title={user ? `${t('signedIn') || 'Signed in as'} ${user.email}` : 'Account'}
              aria-label="Open account menu"
              aria-expanded={isAccountOpen}
            >
              {user ? (
                <>
                  <span className="text-white group-hover:text-black transition-colors duration-200">
                    {user.initials}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-white stroke-white group-hover:text-black group-hover:stroke-black transition-colors duration-200 flex-shrink-0" />
                </>
              ) : (
                <User className="w-[18px] h-[18px] text-white stroke-white group-hover:text-black group-hover:stroke-black transition-colors duration-200" />
              )}
            </button>

            {/* Account Popover Menu */}
            <AccountMenu
              isOpen={isAccountOpen}
              onClose={() => setIsAccountOpen(false)}
              user={user}
              isMobile={isMobileScreen}
            />
          </div>
        </div>
      </nav>
    </header>
  )
}
