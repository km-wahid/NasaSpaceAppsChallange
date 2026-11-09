import { useState } from 'react'
import Logo from './logo'
import { useLocale } from '../lib/i18n'
import AccountMenu from './account_menu'
import { Globe, Search, User } from 'lucide-react'

interface MobileHeaderProps {
  user?: {
    email: string
    initials: string
  } | null
  onOpenCommandPalette?: () => void
}

export default function MobileHeader({ user, onOpenCommandPalette }: MobileHeaderProps) {
  const { locale, setLocale } = useLocale()
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  return (
    <>
      <header className="md:hidden sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 py-2 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo size="sm" showSubtitle={true} href="/" />

        {/* 3 Action Shortcuts with Equal Gap */}
        <div className="flex items-center gap-2">
          {/* 1. Search */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="nav-pill-btn !w-9 !h-9 rounded-full"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* 2. Language Switcher */}
          <button
            type="button"
            onClick={() => setLocale(locale === 'bn' ? 'en' : 'bn')}
            className="nav-pill-btn !h-9 px-2.5 rounded-full text-xs font-bold gap-1"
            title={locale === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
            aria-label="Switch language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{locale === 'bn' ? 'বাং' : 'EN'}</span>
          </button>

          {/* 3. Account Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsAccountOpen(true)}
            className="nav-pill-btn !w-9 !h-9 rounded-full text-xs font-bold uppercase select-none"
            aria-label="Account menu"
          >
            {user ? (
              <span>{user.initials}</span>
            ) : (
              <User className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Sheet Account Menu */}
      <AccountMenu
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        user={user}
        isMobile={true}
      />
    </>
  )
}

