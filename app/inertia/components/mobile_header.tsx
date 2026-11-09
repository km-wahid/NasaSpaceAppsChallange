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
        {/* Brand Logo (Only logo + name on mobile, no subtitle) */}
        <Logo size="sm" showSubtitle={false} href="/" />

        {/* 3 Action Shortcuts with Equal Gap */}
        <div className="flex items-center gap-2">
          {/* 1. Search */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="group flex items-center justify-center w-9 h-9 rounded-full bg-[#15803d] text-white hover:bg-white hover:text-black border border-[#166534] hover:border-slate-300 shadow-xs transition-all duration-200 active:scale-95"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-white stroke-white group-hover:text-black group-hover:stroke-black transition-colors duration-200" />
            </button>
          )}

          {/* 2. Language Switcher */}
          <button
            type="button"
            onClick={() => setLocale(locale === 'bn' ? 'en' : 'bn')}
            className="group flex items-center justify-center h-9 px-2.5 rounded-full bg-[#15803d] text-white hover:bg-white hover:text-black border border-[#166534] hover:border-slate-300 shadow-xs transition-all duration-200 active:scale-95 text-xs font-bold gap-1 select-none"
            title={locale === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
            aria-label="Switch language"
          >
            <Globe className="w-3.5 h-3.5 text-white stroke-white group-hover:text-black group-hover:stroke-black transition-colors duration-200 flex-shrink-0" />
            <span className="text-white group-hover:text-black transition-colors duration-200">
              {locale === 'bn' ? 'বাং' : 'EN'}
            </span>
          </button>

          {/* 3. Account Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsAccountOpen(true)}
            className="group flex items-center justify-center w-9 h-9 rounded-full bg-[#15803d] text-white hover:bg-white hover:text-black border border-[#166534] hover:border-slate-300 shadow-xs transition-all duration-200 active:scale-95 text-xs font-bold uppercase select-none"
            aria-label="Account menu"
          >
            {user ? (
              <span className="text-white group-hover:text-black transition-colors duration-200">
                {user.initials}
              </span>
            ) : (
              <User className="w-4 h-4 text-white stroke-white group-hover:text-black group-hover:stroke-black transition-colors duration-200" />
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

