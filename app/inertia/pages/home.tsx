import { Head, usePage } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { useEffect, useState } from 'react'
import { useLocale } from '../lib/i18n'
import type { InertiaProps } from '../types'
import { type Data } from '@generated/data'
import {
  Compass,
  Layers,
  Sprout,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react'

type NetworkConnection = EventTarget & { saveData?: boolean }

export default function Home({ user }: InertiaProps) {
  const { props } = usePage<Data.SharedProps>()
  const currentUser = user ?? props.user
  const { t, locale } = useLocale()
  const [showHeroVideo, setShowHeroVideo] = useState(false)

  // 4 Minimal Features: Using translation keys so language switch works instantly
  const features = [
    {
      icon: BarChart3,
      title: t('featClimateHist'),
      metric: t('featClimateHistMetric'),
      label: t('featClimateHistLabel'),
    },
    {
      icon: Sprout,
      title: t('featCropRot'),
      metric: t('featCropRotMetric'),
      label: t('featCropRotLabel'),
    },
    {
      icon: Layers,
      title: t('featSoilWater'),
      metric: t('featSoilWaterMetric'),
      label: t('featSoilWaterLabel'),
    },
    {
      icon: Compass,
      title: t('featSatGis'),
      metric: t('featSatGisMetric'),
      label: t('featSatGisLabel'),
    },
  ]

  const seasons = [
    {
      num: '01',
      name: locale === 'bn' ? 'আমন ধান' : 'Aman Rice',
      duration: 'Jul – Nov',
      type: 'Kharif-2',
    },
    {
      num: '02',
      name: locale === 'bn' ? 'সরিষা / ডাল' : 'Mustard / Pulses',
      duration: 'Nov – Feb',
      type: 'Rabi',
    },
    {
      num: '03',
      name: locale === 'bn' ? 'মুগডাল' : 'Mungbean',
      duration: 'Mar – Jun',
      type: 'Kharif-1',
    },
  ]

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = (navigator as Navigator & { connection?: NetworkConnection }).connection
    setShowHeroVideo(!reducedMotion.matches && !connection?.saveData)
  }, [])

  return (
    <div className="w-full">
      <Head title={t('landingHeroTitle') || 'OrbitAgro - NASA EO Intelligence'} />

      {/* Hero Section: Solid flat overlay (No gradients) */}
      <section className="relative w-full min-h-[580px] md:min-h-[640px] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
        {/* Background media */}
        {showHeroVideo ? (
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/media/home-field-sunset.jpg"
          >
            <source src="/videos/vid3.webm" type="video/webm" />
          </video>
        ) : (
          <img
            src="/media/home-field-sunset.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
          />
        )}

        {/* Flat Solid Semi-Transparent Overlay (Zero Gradients) */}
        <div className="absolute inset-0 bg-slate-950/70" />

        {/* Hero Content: 1 Headline, 1 Subline, 2 CTAs */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center flex flex-col items-center">
          {/* Micro tag */}


          {/* 1 Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white max-w-3xl leading-tight">
            {t('landingHeroTitle')}
          </h1>

          {/* 1 Short Subline */}
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
            {t('landingHeroSub')}
          </p>

          {/* CTAs (Explore farm, Login only if unauthenticated) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/farms"
              className="btn-modern bg-success hover:bg-success/90 text-success-content text-sm font-bold shadow-sm"
            >
              <span>{t('landingExploreFarm')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {!currentUser && (
              <Link
                href="/login"
                className="btn-modern bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-semibold cursor-pointer"
              >
                {t('landingLogin')}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 4 Minimal Features Grid: 1 icon + 3 to 5 words each */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feat) => {
            const Icon = feat.icon
            return (
              <div
                key={feat.title}
                className="card-modern p-5 flex flex-col justify-between hover:border-success/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-base-content/70">
                    {feat.title}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-success/10 text-success flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="text-xl font-bold font-mono-data text-base-content my-1">
                  {feat.metric}
                </div>

                <div className="text-xs text-base-content/60 mt-2 pt-2 border-t border-base-300/40">
                  {feat.label}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Crop Rotation 3-Season Sequence Preview */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="card-modern p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-base-300/60">
            <div>
              <span className="nasa-subtitle mb-1">
                <span className="nasa-subtitle-dot" />
                {t('cadenceEyebrow')}
              </span>
              <h2 className="text-xl font-bold text-base-content">
                {t('cadenceTitle')}
              </h2>
            </div>
            <Link
              href="/planner"
              className="btn-modern bg-base-200 hover:bg-base-300 text-base-content text-xs font-semibold self-start sm:self-auto"
            >
              <span>{t('cadenceLaunch')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {seasons.map((season) => (
              <div
                key={season.num}
                className="p-4 rounded-xl bg-base-200/50 border border-base-300/50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs font-mono text-base-content/50 mb-2">
                  <span>SEASON {season.num}</span>
                  <span className="px-2 py-0.5 rounded bg-base-300/60 font-semibold">
                    {season.type}
                  </span>
                </div>
                <div className="text-base font-bold text-base-content my-1">
                  {season.name}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-success font-medium mt-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{season.duration}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-base-300/40 flex items-center justify-between text-xs text-base-content/60">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-success" />
              {t('cadenceNote')}
            </span>
            <span className="font-mono text-[11px] hidden sm:inline">
              {t('cadenceModel')}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
