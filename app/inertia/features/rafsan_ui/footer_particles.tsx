import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  z: number
  size: number
}

const particles: Particle[] = Array.from({ length: 72 }, (_, index) => ({
  x: (((index * 47) % 101) / 100 - 0.5) * 720,
  y: (((index * 71) % 97) / 96 - 0.5) * 320,
  z: (((index * 37) % 89) / 88 - 0.5) * 360,
  size: 0.7 + ((index * 13) % 17) / 10,
}))

export default function FooterParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let visible = false
    let width = 0
    let height = 0

    const draw = (time: number) => {
      frame = 0
      context.clearRect(0, 0, width, height)

      const rotation = reducedMotion ? 0.18 : time * 0.00008
      const cosine = Math.cos(rotation)
      const sine = Math.sin(rotation)

      for (const particle of particles) {
        const rotatedX = particle.x * cosine - particle.z * sine
        const rotatedZ = particle.x * sine + particle.z * cosine
        const perspective = 420 / (620 + rotatedZ)
        const x = width / 2 + rotatedX * perspective
        const y = height / 2 + particle.y * perspective

        if (x < 0 || x > width || y < 0 || y > height) continue

        const depth = Math.max(0.18, Math.min(0.8, (perspective - 0.42) * 1.8))
        context.beginPath()
        context.fillStyle = `rgb(52 211 153 / ${depth})`
        context.arc(x, y, Math.max(0.6, particle.size * perspective), 0, Math.PI * 2)
        context.fill()
      }

      if (visible && !reducedMotion) frame = window.requestAnimationFrame(draw)
    }

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
      width = bounds.width
      height = bounds.height
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      if (reducedMotion || visible) draw(0)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (!visible && frame) {
          window.cancelAnimationFrame(frame)
          frame = 0
        } else if (visible && !frame) {
          frame = window.requestAnimationFrame(draw)
        }
      },
      { rootMargin: '100px 0px', threshold: 0.05 }
    )
    const resizeObserver = new ResizeObserver(resize)

    resizeObserver.observe(canvas)
    observer.observe(canvas)
    resize()

    return () => {
      observer.disconnect()
      resizeObserver.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return <canvas ref={canvasRef} className="rafsan-footer-particles" aria-hidden="true" />
}
