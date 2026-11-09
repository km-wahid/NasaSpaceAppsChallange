import { useState, useEffect, type ReactNode } from 'react'
import Logo from './logo'

interface AuthLayoutProps {
  title: string
  children: ReactNode
}

export default function AuthLayout({ title, children }: AuthLayoutProps) {
  const [showVideo, setShowVideo] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    setShowVideo(!reducedMotion.matches && !connection?.saveData)
  }, [])

  return (
    <div className="min-h-screen min-h-dvh w-full flex flex-col md:flex-row bg-white selection:bg-[#15803d] selection:text-white">
      {/* Left Column (≈55%): Background Video & Clean Branding */}
      <div className="relative w-full md:w-[55%] lg:w-[58%] h-[210px] sm:h-[240px] md:h-auto md:min-h-dvh bg-[#0d3822] text-white overflow-hidden flex flex-col justify-between p-6 md:p-12 lg:p-16 flex-shrink-0">
        {/* Background video with fallback poster */}
        {showVideo && !videoFailed ? (
          <video
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/media/home-field-sunset.jpg"
            onError={() => setVideoFailed(true)}
          >
            <source src="/media/home-field-sunset.mp4" type="video/mp4" />
          </video>
        ) : (
          <img
            src="/media/home-field-sunset.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40"
          />
        )}

        {/* Solid semi-transparent dark overlay (Zero gradients) */}
        <div className="absolute inset-0 bg-black/65" aria-hidden="true" />

        {/* Top Branding (Desktop) */}
        <div className="relative z-10 hidden md:block">
          <Logo size="md" showSubtitle={true} href="/" className="brightness-125" />
        </div>

        {/* Hero Title & Mobile Branding */}
        <div className="relative z-10 my-auto md:my-0 md:py-16">
          <div className="md:hidden mb-2">
            <Logo size="sm" showSubtitle={true} href="/" className="brightness-125" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            {title}
          </h1>
        </div>

        {/* Bottom subtle pilot tag */}
        <div className="relative z-10 hidden md:flex items-center gap-2 text-xs font-mono text-emerald-300/80">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>NASA Earth Observation Agroclimatology</span>
        </div>
      </div>

      {/* Right Column (≈45%): Vertically Centered Minimal Form */}
      <div className="flex-1 w-full md:w-[45%] lg:w-[42%] bg-white flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-[400px] animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  )
}

