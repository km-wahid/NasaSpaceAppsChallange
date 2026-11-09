import { Link } from '@adonisjs/inertia/react'
import { Home, Compass, MapPin, GitCompare, Sprout } from 'lucide-react'
import { useLocale } from '../lib/i18n'

interface BottomNavProps {
  currentPath: string
}

export default function BottomNav({ currentPath }: BottomNavProps) {
  const { t } = useLocale()

  const tabs = [
    { href: '/', label: t('navHome') || 'Home', icon: Home, exact: true },
    { href: '/mission', label: t('navMission') || 'Mission', icon: Compass },
    { href: '/explorer', label: t('navExplorer') || 'Explorer', icon: MapPin },
    { href: '/compare', label: t('navCompare') || 'Compare', icon: GitCompare },
    { href: '/farms', label: t('navFarmWorkspace') || 'Farm', icon: Sprout },
  ]

  const isActive = (href: string, exact = false) => {
    if (exact) return currentPath === href
    return currentPath.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-3 inset-x-3 z-50 md:hidden bottom-nav-dock px-2 py-1.5 transition-transform ease-out duration-200"
      style={{ paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom, 0px))' }}
      aria-label="Mobile Navigation Dock"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = isActive(tab.href, tab.exact)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl transition-transform active:scale-90 ${
                active ? 'text-success font-bold' : 'text-base-content/65 hover:text-base-content'
              }`}
            >
              {/* Active Tab Glow/Indicator */}
              {active && (
                <span
                  className="absolute inset-x-2 -bottom-0.5 h-1 rounded-full bg-success animate-fade-in"
                  aria-hidden="true"
                />
              )}

              <Icon className={`w-5 h-5 transition-transform duration-150 ${active ? 'scale-110' : ''}`} />
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

