import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { useEffect, useState } from 'react'
import Icon from '../components/icon'
import { useLocale } from '../lib/i18n'

type NetworkConnection = EventTarget & { saveData?: boolean }

export default function Home() {
  const { t } = useLocale()
  const [showHeroVideo, setShowHeroVideo] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [missionLayerIndex, setMissionLayerIndex] = useState(0)
  const [missionPaused, setMissionPaused] = useState(false)
  const observations = [
    {
      layer: 'temperature' as const,
      image: '/media/mission-layers/temperature-bangladesh.jpg',
      title: t('observationTemperature'),
      text: t('observationTemperatureBody'),
    },
    {
      layer: 'climate' as const,
      image: '/media/mission-layers/climate-anomaly.jpg',
      title: t('observationClimate'),
      text: t('observationClimateBody'),
    },
    {
      layer: 'soil' as const,
      image: '/media/mission-layers/soil-moisture.jpg',
      title: t('observationSoil'),
      text: t('observationSoilBody'),
    },
    {
      layer: 'rainfall' as const,
      image: '/media/mission-layers/rainfall.jpg',
      title: t('observationRainfall'),
      text: t('observationRainfallBody'),
    },
  ]
  const missionLayers = [
    {
      layer: 'temperature',
      image: '/media/mission-layers/temperature-bangladesh.jpg',
      source:
        'https://science.nasa.gov/earth/earth-observatory/fine-tuning-irrigation-in-asia-148203/',
      title: t('observationTemperature'),
      text: t('observationTemperatureBody'),
    },
    {
      layer: 'rainfall',
      image: '/media/mission-layers/rainfall.jpg',
      source:
        'https://science.nasa.gov/earth/earth-observatory/excessive-monsoon-rains-flood-asia-147006/',
      title: t('observationRainfall'),
      text: t('observationRainfallBody'),
    },
    {
      layer: 'soil',
      image: '/media/mission-layers/soil-moisture.jpg',
      source: 'https://earthobservatory.nasa.gov/images/145116/food-crisis-grows-from-dry-soils',
      title: t('observationSoil'),
      text: t('observationSoilBody'),
    },
    {
      layer: 'climate',
      image: '/media/mission-layers/climate-anomaly.jpg',
      source: 'https://earthobservatory.nasa.gov/world-of-change/global-temperatures',
      title: t('observationClimate'),
      text: t('observationClimateBody'),
    },
    {
      layer: 'vegetation',
      image: '/media/mission-layers/vegetation.jpg',
      source:
        'https://earthobservatory.nasa.gov/images/147831/nasa-data-aid-food-security-assessments-in-kenya',
      title: t('observationVegetation'),
      text: t('observationVegetationBody'),
    },
  ]
  const missionSteps = [
    { icon: 'satellite' as const, title: t('capture'), text: t('captureBody') },
    { icon: 'layers' as const, title: t('calibrate'), text: t('calibrateBody') },
    { icon: 'sprout' as const, title: t('recommend'), text: t('recommendBody') },
  ]

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = (navigator as Navigator & { connection?: NetworkConnection }).connection
    const updateVideoPreference = () => {
      setPrefersReducedMotion(reducedMotion.matches)
      setShowHeroVideo(!reducedMotion.matches && !connection?.saveData)
    }

    updateVideoPreference()
    reducedMotion.addEventListener('change', updateVideoPreference)
    connection?.addEventListener('change', updateVideoPreference)

    return () => {
      reducedMotion.removeEventListener('change', updateVideoPreference)
      connection?.removeEventListener('change', updateVideoPreference)
    }
  }, [])

  useEffect(() => {
    if (missionPaused || prefersReducedMotion) return

    const interval = window.setInterval(() => {
      setMissionLayerIndex((current) => (current + 1) % missionLayers.length)
    }, 4500)

    return () => window.clearInterval(interval)
  }, [missionPaused, prefersReducedMotion, missionLayers.length])

  return (
    <>
      <Head title={t('homeTitle')} />
      <section className="hero oa-hero oa-hero-video" aria-labelledby="home-hero-title">
        {showHeroVideo && (
          <video
            className="oa-hero-video-media"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/media/home-field-sunset.jpg"
            aria-hidden="true"
            tabIndex={-1}
          >
            <source src="/videos/vid3.webm" type="video/webm" />
          </video>
        )}
        <div className="hero-overlay oa-hero-video-overlay" />
        <div className="hero-content oa-hero-copy oa-hero-video-copy">
          <div>
            <span className="badge badge-success badge-soft oa-eyebrow">
              <Icon name="satellite" size={16} /> {t('homeBadge')}
            </span>
            <p className="oa-kicker">
              <Icon name="sprout" size={18} /> {t('homeKicker')}
            </p>
            <h1 id="home-hero-title">{t('homeTitle')}</h1>
            <h2>{t('homeSubtitle')}</h2>
            <p className="oa-lead">{t('homeBody')}</p>
            <div className="oa-actions">
              <Link href="/planner" className="btn btn-primary">
                {t('homePrimary')} <Icon name="arrow" size={18} />
              </Link>
              <Link href="/explorer" className="btn btn-outline">
                {t('homeSecondary')} <Icon name="layers" size={18} />
              </Link>
            </div>
            <p className="oa-trust">
              <Icon name="shield" size={17} /> {t('homeTrust')}
            </p>
          </div>
        </div>
      </section>

      <section className="oa-mission-overview" aria-labelledby="mission-overview-title">
        <div className="oa-mission-copy">
          <p className="oa-kicker">
            <Icon name="globe" size={18} /> {t('missionEyebrow')}
          </p>
          <h2 id="mission-overview-title">{t('missionTitle')}</h2>
          <p className="oa-mission-intro">{t('missionBody')}</p>
          <ol className="oa-mission-steps">
            {missionSteps.map((step, index) => (
              <li key={step.title}>
                <span className="oa-mission-step-icon">
                  <Icon name={step.icon} size={20} />
                </span>
                <div>
                  <small>0{index + 1}</small>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/mission" className="btn btn-primary">
            {t('missionOverviewAction')} <Icon name="arrow" size={18} />
          </Link>
        </div>

        <article className="card card-border oa-mission-visual">
          <div className="oa-mission-visual-head">
            <span>{t('missionLayersLabel')}</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setMissionPaused((paused) => !paused)}
              aria-pressed={missionPaused}
            >
              {missionPaused ? t('missionPlay') : t('missionPause')}
            </button>
          </div>
          <div className="oa-mission-visual-viewport">
            {missionLayers.map((item, index) => (
              <div
                className={`oa-mission-frame ${index === missionLayerIndex ? 'is-active' : ''}`}
                key={item.layer}
                aria-hidden={index !== missionLayerIndex}
              >
                <img
                  className="oa-mission-satellite-image"
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                />
                <span className="oa-mission-frame-number">0{index + 1}</span>
              </div>
            ))}
          </div>
          <div className="card-body oa-mission-visual-body">
            <div aria-live="polite">
              <h3 className="card-title">{missionLayers[missionLayerIndex].title}</h3>
              <p>{missionLayers[missionLayerIndex].text}</p>
              <a
                className="link link-hover oa-mission-image-credit"
                href={missionLayers[missionLayerIndex].source}
                target="_blank"
                rel="noreferrer"
              >
                {t('missionImageCredit')}
              </a>
            </div>
            <div className="oa-mission-layer-controls" aria-label={t('missionLayersLabel')}>
              {missionLayers.map((item, index) => (
                <button
                  type="button"
                  className={`btn btn-circle btn-xs ${index === missionLayerIndex ? 'btn-primary' : 'btn-ghost'}`}
                  key={item.layer}
                  onClick={() => {
                    setMissionLayerIndex(index)
                    setMissionPaused(true)
                  }}
                  aria-label={item.title}
                  aria-current={index === missionLayerIndex ? 'true' : undefined}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="oa-section">
        <div className="oa-section-heading">
          <p className="oa-kicker">{t('observationEyebrow')}</p>
          <h2>{t('observationTitle')}</h2>
          <p>{t('observationBody')}</p>
        </div>
        <div className="oa-observation-stories">
          {observations.map((item, index) => (
            <article className="card card-border oa-observation-story" key={item.layer}>
              <figure className="oa-observation-image">
                <img src={item.image} alt={item.title} loading="lazy" decoding="async" />
              </figure>
              <div className="card-body">
                <span className="oa-step-number">0{index + 1}</span>
                <h3 className="card-title">{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="oa-cycle-section">
        <div>
          <p className="oa-kicker">
            <Icon name="sprout" size={18} /> ৩ SEASONS
          </p>
          <h2>{t('homeCycleTitle')}</h2>
          <p>{t('homeCycleBody')}</p>
          <Link href="/planner" className="btn btn-primary">
            {t('homePrimary')} <Icon name="arrow" size={18} />
          </Link>
        </div>
        <ol className="oa-cycle" aria-label="Three season crop cycle">
          <li>
            <span>01</span>
            <strong>আমন ধান</strong>
            <small>Jul–Nov</small>
          </li>
          <li>
            <span>02</span>
            <strong>সরিষা / ডাল</strong>
            <small>Nov–Feb</small>
          </li>
          <li>
            <span>03</span>
            <strong>মুগডাল</strong>
            <small>Mar–Jun</small>
          </li>
        </ol>
      </section>
    </>
  )
}
