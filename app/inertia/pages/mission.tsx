import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { useEffect, useState } from 'react'
import Icon from '../components/icon'
import { useLocale } from '../lib/i18n'

export default function Mission() {
  const { t } = useLocale()
  const [activeStep, setActiveStep] = useState(0)
  const pipeline = [
    {
      icon: 'satellite' as const,
      title: t('missionStepObserve'),
      text: t('missionStepObserveBody'),
    },
    {
      icon: 'layers' as const,
      title: t('missionStepUnderstand'),
      text: t('missionStepUnderstandBody'),
    },
    { icon: 'soil' as const, title: t('missionStepCompare'), text: t('missionStepCompareBody') },
    { icon: 'sprout' as const, title: t('missionStepAct'), text: t('missionStepActBody') },
  ]
  const pressures = [
    { icon: 'sun' as const, title: t('drought'), value: 'HIGH', color: 'badge-warning' },
    { icon: 'rain' as const, title: t('flood'), value: 'SEASONAL', color: 'badge-info' },
    { icon: 'soil' as const, title: t('soilLoss'), value: 'WATCH', color: 'badge-error' },
  ]

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return

    const steps = document.querySelectorAll<HTMLElement>('[data-mission-step]')
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleStep = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visibleStep) {
          setActiveStep(Number((visibleStep.target as HTMLElement).dataset.missionStep))
        }
      },
      { rootMargin: '-24% 0px -42%', threshold: [0.2, 0.45, 0.7] }
    )

    steps.forEach((step) => observer.observe(step))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <Head title={t('missionTitle')} />
      <section
        className="hero oa-hero oa-hero-video oa-mission-video-hero"
        aria-labelledby="mission-hero-title"
      >
        <video
          className="oa-hero-video-media"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/videos/vid2.mp4" type="video/mp4" />
          {t('missionVideoFallback')}
        </video>
        <div className="hero-content oa-hero-copy oa-mission-video-hero-copy">
          <div>
            <p className="oa-kicker">
              <Icon name="satellite" size={18} /> {t('missionEyebrow')}
            </p>
            <h1 id="mission-hero-title">{t('missionTitle')}</h1>
            <p className="oa-lead">{t('missionBody')}</p>
            <div className="oa-actions">
              <Link className="btn btn-primary btn-lg" href="/planner">
                {t('missionPrimary')} <Icon name="arrow" />
              </Link>
              <Link className="btn btn-outline btn-lg" href="/explorer">
                {t('missionSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="oa-section oa-mission-scroll" aria-labelledby="mission-scroll-title">
        <div className="oa-section-heading">
          <p className="oa-kicker">01 / {t('missionScrollEyebrow')}</p>
          <h2 id="mission-scroll-title">{t('missionPipeline')}</h2>
          <p>{t('missionScrollBody')}</p>
        </div>
        <div className="oa-mission-scroll-layout">
          <div className="oa-mission-scroll-steps">
            {pipeline.map((step, index) => (
              <article
                className={`card card-border oa-mission-scroll-step${activeStep === index ? ' is-active' : ''}`}
                data-mission-step={index}
                key={step.title}
              >
                <div className="card-body">
                  <div className="oa-mission-scroll-step-head">
                    <span className="oa-mission-scroll-icon">
                      <Icon name={step.icon} size={30} />
                    </span>
                    <span className="badge badge-outline">0{index + 1}</span>
                  </div>
                  <h3 className="card-title">{step.title}</h3>
                  <p>{step.text}</p>
                  <span className="oa-mission-scroll-signal" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </article>
            ))}
          </div>

          <aside className="oa-mission-scroll-visual" aria-hidden="true">
            <div className="oa-mission-orbit">
              <span className="oa-mission-orbit-ring" />
              <span className="oa-mission-orbit-ring oa-mission-orbit-ring-inner" />
              <div className="oa-mission-orbit-icon" key={activeStep}>
                <Icon name={pipeline[activeStep].icon} size={58} />
              </div>
              <span className="oa-mission-orbit-dot" />
            </div>
            <div className="oa-mission-visual-status">
              <span>0{activeStep + 1} / 04</span>
              <strong>{pipeline[activeStep].title}</strong>
              <small>{pipeline[activeStep].text}</small>
            </div>
            <ul className="steps steps-horizontal oa-mission-progress">
              {pipeline.map((step, index) => (
                <li
                  className={`step${index <= activeStep ? ' step-primary' : ''}`}
                  key={step.title}
                />
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="oa-section oa-pressure-section">
        <div className="oa-section-heading">
          <p className="oa-kicker">02 / FIELD REALITY</p>
          <h2>{t('missionPressure')}</h2>
        </div>
        <div className="oa-pressure-grid">
          {pressures.map((pressure) => (
            <article className="card card-border" key={pressure.title}>
              <div className="card-body">
                <div className="oa-card-top">
                  <Icon name={pressure.icon} size={30} />
                  <span className={`badge badge-soft ${pressure.color}`}>{pressure.value}</span>
                </div>
                <h3 className="card-title">{pressure.title}</h3>
                <progress
                  className="progress progress-primary"
                  value={pressure.value === 'HIGH' ? 78 : pressure.value === 'SEASONAL' ? 61 : 54}
                  max="100"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="oa-pillars">
        <div>
          <p className="oa-kicker">03 / ROTATION LOGIC</p>
          <h2>{t('missionPillars')}</h2>
          <p>{t('missionBody')}</p>
        </div>
        <ol>
          <li>
            <Icon name="soil" />
            <span>
              <strong>{t('soilRecovery')}</strong>
              <small>Legume breaks and residue-aware sequences</small>
            </span>
          </li>
          <li>
            <Icon name="water" />
            <span>
              <strong>{t('climateFit')}</strong>
              <small>Seasonal water and temperature constraints</small>
            </span>
          </li>
          <li>
            <Icon name="money" />
            <span>
              <strong>{t('economicStability')}</strong>
              <small>Transparent trade-offs where evidence exists</small>
            </span>
          </li>
        </ol>
      </section>
    </>
  )
}
