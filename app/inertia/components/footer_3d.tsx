import { useEffect, useRef, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import Logo from './logo'
import ParticleGridCanvas from './particle_grid_canvas'
import { Mail, ExternalLink } from 'lucide-react'
import { useLocale } from '../lib/i18n'

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function LinkedinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function FacebookIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

export default function Footer3D() {
  const { t } = useLocale()
  const footerRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  // IntersectionObserver: render particles only when footer is near or in viewport
  useEffect(() => {
    const el = footerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      {
        rootMargin: '100px 0px 50px 0px',
        threshold: 0.05,
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <footer
      ref={footerRef}
      className="relative w-full overflow-hidden text-slate-300"
      style={{ backgroundColor: '#060a14' }}
    >
      {/* Three.js 3D Particle Grid Layer */}
      <ParticleGridCanvas inView={inView} />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12">
          {/* Left Column: Brand & Tagline */}
          <div className="md:col-span-5 space-y-4">
            <Logo size="md" showSubtitle={true} href="/" />

            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Deterministic agro-climatic intelligence and crop rotation support for resilient farming across Bangladesh.
            </p>

            {/* Social Icon Circles with smooth lift */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white hover:border-emerald-500 hover:-translate-y-0.5 transition-all"
                aria-label="GitHub"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white hover:border-emerald-500 hover:-translate-y-0.5 transition-all"
                aria-label="LinkedIn"
              >
                <LinkedinIcon className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white hover:border-emerald-500 hover:-translate-y-0.5 transition-all"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a
                href="mailto:contact@orbitagro.org"
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white hover:border-emerald-500 hover:-translate-y-0.5 transition-all"
                aria-label="Mail"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Center Column: Navigation */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  {t('navHome') || 'Home'}
                </Link>
              </li>
              <li>
                <Link href="/mission" className="hover:text-emerald-400 transition-colors">
                  {t('navMission') || 'Mission & Methodology'}
                </Link>
              </li>
              <li>
                <Link href="/explorer" className="hover:text-emerald-400 transition-colors">
                  {t('navExplorer') || 'EO Explorer'}
                </Link>
              </li>
              <li>
                <Link href="/explorer/map" className="hover:text-emerald-400 transition-colors">
                  {t('navMap') || 'Bangladesh GIS View'}
                </Link>
              </li>
              <li>
                <Link href="/farms" className="hover:text-emerald-400 transition-colors">
                  {t('navFarmWorkspace') || 'Farm Workspace'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Column: Legal & Data Attribution */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">
              Data & Legal
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a
                  href="https://power.larc.nasa.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
                >
                  <span>NASA POWER Agroclimatology</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://modis.gsfc.nasa.gov/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
                >
                  <span>NASA MODIS Terra/Aqua</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <span className="text-xs text-slate-500 block pt-1">
                  Deterministic decision engine. Zero external LLMs or non-deterministic algorithms in scoring.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Thin Divider & Copyright */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} OrbitAgro. NASA Space Apps Challenge.</p>
          <p className="font-mono text-[11px] text-slate-400">
            Bangladesh Agroclimatology Pilot
          </p>
        </div>
      </div>
    </footer>
  )
}
