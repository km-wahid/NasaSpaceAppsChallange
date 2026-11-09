import { useState, useRef, useEffect } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { ArrowRight, ChevronDown, Play, Pause } from 'lucide-react'

export default function MissionHero() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mediaQuery.matches)

    const handleChange = () => setIsReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Auto-pause video when scrolled out of viewport to save battery/data
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            video.pause()
          } else if (isPlaying && !isReducedMotion) {
            video.play().catch(() => {})
          }
        })
      },
      { threshold: 0.25 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [isPlaying, isReducedMotion])

  // Play/pause toggle
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {})
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  // Smooth scroll to "From Orbit to Acre"
  const scrollToMethodology = () => {
    const target = document.getElementById('orbit-to-acre')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Subtle 3D card tilt parallax on mouse move (Desktop only)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion || window.innerWidth < 1024) return
    const card = cardRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const rotateX = (-y / (rect.height / 2)) * 2.5
    const rotateY = (x / (rect.width / 2)) * 2.5

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`
  }

  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  }

  return (
    <section
      className="relative w-full bg-transparent text-white overflow-hidden flex flex-col justify-between pt-[75px] sm:pt-[80px] lg:pt-[85px] pb-8 lg:pb-10 rounded-b-[32px] select-none"
      aria-label="Mission Introduction"
    >
      {/* Main Content Grid: 1200px max container, top-aligned to eliminate empty void */}
      <div className="w-full max-w-[1200px] mx-auto px-6 sm:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column (≈45% on desktop): Minimal Text Block */}
          <div className="lg:col-span-5 flex flex-col items-start text-left pt-1">
            {/* Eyebrow: mono, uppercase, 0.18em tracking, accent green dot */}
            <div className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs uppercase tracking-[0.18em] text-emerald-400 font-semibold mb-3.5 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block flex-shrink-0 animate-pulse" />
              <span>NASA EO INTELLIGENCE</span>
            </div>

            {/* H1: Large, clamped, tight line-height */}
            <h1 className="text-3xl sm:text-5xl lg:text-[clamp(2.5rem,5.2vw,4.25rem)] font-extrabold text-[#183329] tracking-tight leading-[1.08] mb-4">
              Understand your land.
            </h1>

            {/* Subline: 1 line, white 70% opacity, 18px */}
            <p className="text-base sm:text-lg text-[#183329]/70 font-normal leading-relaxed mb-7 max-w-lg">
              Satellite data, turned into farm decisions.
            </p>

            {/* 2 Buttons Side by Side */}
            <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
              {/* Primary: Solid Accent Green */}
              <Link
                href="/explorer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#15803d] hover:bg-[#166534] text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-sm transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <span>Explore data</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Secondary: Transparent, 1px white/30% border */}
              <button
                type="button"
                onClick={scrollToMethodology}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/10 text-white border border-white/30 font-semibold text-sm px-6 py-3.5 rounded-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>How it works</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column (≈55% on desktop): Video Card */}
          <div className="lg:col-span-7 w-full flex items-center justify-center">
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className={`relative w-full aspect-[16/9] rounded-[24px] sm:rounded-[28px] border border-white/10 bg-[#07130e] shadow-2xl overflow-hidden transition-transform duration-300 ease-out ${
                isReducedMotion ? '' : 'lg:hover:shadow-emerald-950/40'
              }`}
              style={{ willChange: 'transform' }}
            >
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay={!isReducedMotion}
                muted
                loop
                playsInline
                preload="metadata"
                poster="/media/mission-hero-poster.jpg"
                className="w-full h-full object-cover pointer-events-none select-none"
                aria-hidden="true"
              >
                <source src="/media/mission-hero.mp4" type="video/mp4" />
              </video>

              {/* Solid semi-transparent dark overlay (no gradient, 20% opacity) */}
              <div
                className="absolute inset-0 bg-black/20 pointer-events-none"
                aria-hidden="true"
              />

              {/* Glass-style Chip: NASA POWER · MODIS */}
              <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-[#0B1F17]/85 backdrop-blur-md border border-white/15 text-[11px] font-mono tracking-wider text-emerald-300 font-medium select-none shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>NASA POWER · MODIS</span>
              </div>

              {/* Accessible Pause/Play Button */}
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
                className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-[#0B1F17]/85 hover:bg-[#0B1F17] backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 active:scale-90 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Scroll Cue at bottom */}
      <div className="w-full flex flex-col items-center justify-center pt-4 sm:pt-6 z-10">
        <button
          type="button"
          onClick={scrollToMethodology}
          aria-label="Scroll down to methodology"
          className="text-white/50 hover:text-white transition-colors duration-200 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-full cursor-pointer animate-bounce"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </section>
  )
}

