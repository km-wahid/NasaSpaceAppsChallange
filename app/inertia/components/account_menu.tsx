import { useEffect, useRef } from 'react'
import { Link, Form } from '@adonisjs/inertia/react'
import { useLocale } from '../lib/i18n'
import {
  User,
  Sprout,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Compass,
  X,
} from 'lucide-react'

interface AccountMenuProps {
  isOpen: boolean
  onClose: () => void
  user?: {
    email: string
    initials: string
  } | null
  isMobile?: boolean
}

export default function AccountMenu({ isOpen, onClose, user, isMobile = false }: AccountMenuProps) {
  const { t } = useLocale()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // User display name from email (e.g. farmer@orbitagro.org -> farmer)
  const displayName = user?.email ? user.email.split('@')[0] : 'Guest'

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col justify-end">
        {/* Dim backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Slide-up bottom sheet with generous bottom padding for mobile dock clearance */}
        <div
          ref={menuRef}
          className="relative w-full bg-base-100 rounded-t-2xl border-t border-base-300 shadow-2xl px-5 pt-5 pb-24 sm:pb-8 z-10 animate-fade-in space-y-4 max-h-[85vh] overflow-y-auto"
          style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Drag Handle Bar */}
          <div className="w-12 h-1.5 bg-base-300 rounded-full mx-auto mb-2" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-base-300/70">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#15803d] text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                {user ? user.initials : <User className="w-5 h-5 text-white" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-base-content capitalize truncate">
                  {user ? displayName : 'OrbitAgro Guest'}
                </div>
                <div className="text-xs font-mono text-base-content/60 truncate">
                  {user ? user.email : 'Public demo mode'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-base-content/60 hover:text-base-content rounded-full hover:bg-base-200"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action List */}
          <div className="space-y-2">
            {user ? (
              <>
                <Link
                  href="/farms"
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors text-xs font-semibold text-base-content"
                >
                  <div className="w-8 h-8 rounded-lg bg-success/15 text-success flex items-center justify-center">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div>{t('navFarmWorkspace') || 'Farm Workspace'}</div>
                    <div className="text-[11px] font-normal text-base-content/60">
                      Manage plots & rotation plans
                    </div>
                  </div>
                </Link>

                <Link
                  href="/mission"
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors text-xs font-semibold text-base-content"
                >
                  <div className="w-8 h-8 rounded-lg bg-base-200 text-base-content/70 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div>{t('navMission') || 'Mission & Methodology'}</div>
                    <div className="text-[11px] font-normal text-base-content/60">
                      Scientific calibration overview
                    </div>
                  </div>
                </Link>

                <div className="border-t border-slate-200/80 pt-2.5 mt-2.5 mb-2">
                  <Form route="session.destroy">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-start gap-[10px] py-3 px-4 rounded-[13px] bg-[#F8E4E1] hover:bg-[#F3D3CE] text-[#B42318] active:scale-[0.98] transition-all duration-150 font-semibold text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318]/40 cursor-pointer text-left select-none shadow-xs"
                    >
                      <LogOut className="w-4 h-4 text-[#B42318] stroke-[#B42318] flex-shrink-0" />
                      <span>{t('logout') || 'Log out'}</span>
                    </button>
                  </Form>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl bg-success text-white transition-colors text-xs font-bold shadow-xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
                    <LogIn className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div>{t('login') || 'Log in'}</div>
                    <div className="text-[11px] font-normal text-white/80">
                      Sign in to your farmer workspace
                    </div>
                  </div>
                </Link>

                <Link
                  href="/signup"
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl bg-base-200 hover:bg-base-300 transition-colors text-xs font-semibold text-base-content"
                >
                  <div className="w-8 h-8 rounded-lg bg-base-300/80 text-base-content flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div>{t('signup') || 'Get started'}</div>
                    <div className="text-[11px] font-normal text-base-content/60">
                      Create a new farm account
                    </div>
                  </div>
                </Link>

                <Link
                  href="/mission"
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors text-xs font-semibold text-base-content"
                >
                  <div className="w-8 h-8 rounded-lg bg-base-200 text-base-content/70 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div>{t('navMission') || 'Methodology'}</div>
                    <div className="text-[11px] font-normal text-base-content/60">
                      From Orbit to Acre
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Desktop Floating Dropdown Menu
  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-64 bg-base-100 rounded-2xl border border-base-300 shadow-xl p-4 z-50 animate-fade-in space-y-3"
      role="menu"
      aria-label="Account Menu"
    >
      {/* User Avatar + Name + Email Header (16px padding layout) */}
      <div className="flex items-center gap-3 pb-3 border-b border-base-300/70">
        <div className="w-10 h-10 rounded-full bg-[#15803d] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
          {user ? user.initials : <User className="w-4 h-4 text-white" />}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-base-content capitalize truncate">
            {user ? displayName : 'OrbitAgro Guest'}
          </div>
          <div className="text-[11px] font-mono text-base-content/60 truncate">
            {user ? user.email : 'Public demo mode'}
          </div>
        </div>
      </div>

      {/* Item List (8px gap) */}
      <div className="space-y-1">
        {user ? (
          <>
            <Link
              href="/farms"
              onClick={onClose}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-base-content/85 hover:text-base-content hover:bg-base-200 transition-colors"
              role="menuitem"
            >
              <Sprout className="w-4 h-4 text-success" />
              <span>{t('navFarmWorkspace') || 'Farm Workspace'}</span>
            </Link>

            <Link
              href="/planner"
              onClick={onClose}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-base-content/85 hover:text-base-content hover:bg-base-200 transition-colors"
              role="menuitem"
            >
              <Settings className="w-4 h-4 text-base-content/60" />
              <span>{t('navPlanner') || 'Rotation Planner'}</span>
            </Link>

            <div className="border-t border-slate-200/80 pt-2.5 mt-2.5">
              <Form route="session.destroy">
                <button
                  type="submit"
                  className="w-full flex items-center justify-start gap-[10px] py-3 px-4 rounded-[13px] bg-[#F8E4E1] hover:bg-[#F3D3CE] text-[#B42318] active:scale-[0.98] transition-all duration-150 font-semibold text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318]/40 cursor-pointer text-left select-none"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4 text-[#B42318] stroke-[#B42318] flex-shrink-0" />
                  <span>{t('logout') || 'Log out'}</span>
                </button>
              </Form>
            </div>
          </>
        ) : (
          <>
            <Link
              href="/login"
              onClick={onClose}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold bg-success text-white hover:bg-success/90 transition-colors"
              role="menuitem"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('login') || 'Log in'}</span>
            </Link>

            <Link
              href="/signup"
              onClick={onClose}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-base-content/85 hover:text-base-content hover:bg-base-200 transition-colors"
              role="menuitem"
            >
              <UserPlus className="w-4 h-4 text-base-content/60" />
              <span>{t('signup') || 'Get started'}</span>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

