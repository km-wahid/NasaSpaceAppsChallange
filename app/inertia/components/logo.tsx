import { Link } from '@adonisjs/inertia/react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showSubtitle?: boolean
  showText?: boolean
  className?: string
  href?: string
}

export default function Logo({
  size = 'md',
  showSubtitle = true,
  showText = true,
  className = '',
  href = '/',
}: LogoProps) {
  const iconDimensions = {
    sm: 26,
    md: 34,
    lg: 46,
  }[size]

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size]

  const content = (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Crisp Brand Leaf Image */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: iconDimensions, height: iconDimensions }}
      >
        <img
          src="/brand/leaf.png"
          alt="OrbitAgro"
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-xs"
          width={iconDimensions}
          height={iconDimensions}
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className={`font-bold tracking-tight text-base-content leading-none ${titleSizes}`}>
            Orbit<span className="text-success">Agro</span>
          </span>
          {showSubtitle && (
            <span className="nasa-subtitle mt-0.5">
              <span className="nasa-subtitle-dot" />
              NASA EO INTELLIGENCE
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success rounded-lg">
        {content}
      </Link>
    )
  }

  return content
}

