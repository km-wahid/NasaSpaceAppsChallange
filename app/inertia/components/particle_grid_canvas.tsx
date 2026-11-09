import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ParticleCanvasProps {
  inView: boolean
}

export default function ParticleGridCanvas({ inView }: ParticleCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const isRunningRef = useRef(false)
  const animFrameIdRef = useRef<number | null>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Detect WebGL support
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      // Fallback if WebGL unavailable
      return
    }

    const width = container.clientWidth || 800
    const height = container.clientHeight || 450
    const isMobile = window.innerWidth < 768

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(0, 1.5, 6)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0) // transparent clear color, background is handled by CSS solid
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // 1. Dotted Perspective Grid Rays (Radiating from top-center outward & downward)
    const rayCount = isMobile ? 14 : 26
    const dotsPerRay = isMobile ? 25 : 45
    const rayPositions: number[] = []
    const rayColors: number[] = []

    const startX = 0
    const startY = 3.5
    const startZ = -12

    const colorNear = new THREE.Color(0x22c55e) // emerald green
    const colorFar = new THREE.Color(0x38bdf8) // subtle sky blue

    for (let r = 0; r < rayCount; r++) {
      const angle = (r / (rayCount - 1) - 0.5) * Math.PI * 0.75 // spread spread angle
      const endX = Math.sin(angle) * 16
      const endY = -4.5
      const endZ = 8

      for (let d = 0; d < dotsPerRay; d++) {
        const t = d / (dotsPerRay - 1)
        // Add subtle perspective curve
        const px = startX + (endX - startX) * t
        const py = startY + (endY - startY) * Math.pow(t, 1.2)
        const pz = startZ + (endZ - startZ) * t

        rayPositions.push(px, py, pz)

        // Interpolate color along ray
        const mixedColor = colorNear.clone().lerp(colorFar, t)
        rayColors.push(mixedColor.r, mixedColor.g, mixedColor.b)
      }
    }

    const rayGeometry = new THREE.BufferGeometry()
    rayGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rayPositions, 3))
    rayGeometry.setAttribute('color', new THREE.Float32BufferAttribute(rayColors, 3))

    // Dotted Ray Material
    const rayMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.06 : 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    })

    const rayPoints = new THREE.Points(rayGeometry, rayMaterial)
    scene.add(rayPoints)

    // 2. Floating Star / Dust Particles (slow 3D drift)
    const starCount = isMobile ? 90 : 220
    const starPositions = new Float32Array(starCount * 3)
    const starVelocities: { x: number; y: number; z: number }[] = []

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 20
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 10
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 16

      starVelocities.push({
        x: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.002,
        z: 0.004 + Math.random() * 0.006, // gentle forward drift
      })
    }

    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))

    const starMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.04 : 0.05,
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    })

    const starPoints = new THREE.Points(starGeometry, starMaterial)
    scene.add(starPoints)

    // Parallax mouse movement tracking
    let targetMouseX = 0
    let targetMouseY = 0
    let currentMouseX = 0
    let currentMouseY = 0

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      targetMouseX = x * 0.45
      targetMouseY = y * 0.25
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // Resize Handler
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    // Animation Loop
    let clock = new THREE.Clock()

    const animate = () => {
      if (!isRunningRef.current) return

      const time = clock.getElapsedTime()

      // Smooth camera parallax
      currentMouseX += (targetMouseX - currentMouseX) * 0.05
      currentMouseY += (targetMouseY - currentMouseY) * 0.05
      camera.position.x = currentMouseX
      camera.position.y = 1.5 + currentMouseY
      camera.lookAt(0, 0, -2)

      // Slow drift of star particles
      const positions = starGeometry.attributes.position.array as Float32Array
      for (let i = 0; i < starCount; i++) {
        positions[i * 3 + 2] += starVelocities[i].z
        // Wrap around when passing camera
        if (positions[i * 3 + 2] > 6) {
          positions[i * 3 + 2] = -10
          positions[i * 3] = (Math.random() - 0.5) * 20
          positions[i * 3 + 1] = (Math.random() - 0.5) * 10
        }
      }
      starGeometry.attributes.position.needsUpdate = true

      // Gentle wave in the ray grid
      rayPoints.rotation.z = Math.sin(time * 0.2) * 0.015

      renderer.render(scene, camera)
      animFrameIdRef.current = requestAnimationFrame(animate)
    }

    isRunningRef.current = inView
    if (inView) {
      animate()
    }

    return () => {
      isRunningRef.current = false
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)

      // Cleanup WebGL resources
      rayGeometry.dispose()
      rayMaterial.dispose()
      starGeometry.dispose()
      starMaterial.dispose()
      renderer.dispose()
    }
  }, [inView])

  return <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden" />
}
