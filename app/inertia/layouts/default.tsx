import { Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { usePage } from '@inertiajs/react'
import { ReactElement, useEffect, useState } from 'react'
import Navbar from '../components/navbar'
import MobileHeader from '../components/mobile_header'
import BottomNav from '../components/bottom_nav'
import Footer3D from '../components/footer_3d'
import CommandPalette from '../components/command_palette'
import { useLocale } from '../lib/i18n'

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  const { url } = usePage()
  const { t } = useLocale()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const user = children.props.user
  const path = url.split(/[?#]/)[0]
  const isFullscreenMap = path === '/explorer/map'
  const isAuthPage = path === '/login' || path === '/signup'

  // Dismiss toast and close dialogs on navigation
  useEffect(() => {
    toast.dismiss()
    setCommandPaletteOpen(false)
  }, [url])

  // Show backend flash errors
  useEffect(() => {
    if (children.props.flash?.error) {
      toast.error(children.props.flash.error)
    }
  }, [children.props.flash?.error])

  // Global Ctrl/Cmd + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={`min-h-screen flex flex-col bg-base-100 text-base-content selection:bg-success selection:text-success-content ${
      isFullscreenMap ? 'h-screen overflow-hidden' : ''
    }`}>
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-success text-success-content font-bold rounded-lg shadow-lg"
      >
        {t('skip') || 'Skip to main content'}
      </a>

      {/* Desktop Floating Navbar */}
      {!isAuthPage && (
        <Navbar
          currentPath={path}
          user={user}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
      )}

      {/* Mobile Top Header (Minimal) */}
      {!isAuthPage && (
        <MobileHeader
          user={user}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
      )}

      {/* Main Page Content */}
      <main
        id="main-content"
        className={`flex-1 w-full ${
          isAuthPage
            ? 'p-0 m-0'
            : isFullscreenMap
            ? 'h-[calc(100vh-56px)] md:h-screen p-0 m-0 overflow-hidden'
            : path === '/'
            ? 'pb-24 md:pb-0'
            : 'pt-20 md:pt-28 pb-24 md:pb-0'
        }`}
      >
        {children}
      </main>

      {/* Mobile Floating Bottom Navigation Dock (Excluded on GIS map & Auth pages) */}
      {!isFullscreenMap && !isAuthPage && <BottomNav currentPath={path} />}

      {/* Interactive 3D Three.js Footer (excluded on full-screen GIS map & Auth pages) */}
      {!isFullscreenMap && !isAuthPage && <Footer3D />}

      {/* Command Palette (Cmd/Ctrl + K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Notifications */}
      <Toaster position="top-center" richColors />
    </div>
  )
}
