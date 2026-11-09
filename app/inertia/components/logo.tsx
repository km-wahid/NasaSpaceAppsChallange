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
    sm: 24,
    md: 32,
    lg: 44,
  }[size]

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size]

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Crisp Vector / Leaf Image Logo */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-success/10 p-1 text-success flex-shrink-0"
        style={{ width: iconDimensions, height: iconDimensions }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M78 28C74 18 64 12 50 14C33 16 18 30 18 52C18 73 34 86 52 86C72 86 84 70 84 50C84 41 81 34 78 28Z"
            fill="currentColor"
          />
          <path
            d="M78 28C65 32 46 45 35 62C44 65 58 64 70 54C79 46 82 37 78 28Z"
            fill="#22c55e"
          />
          <path
            d="M22 66C32 52 50 40 76 29C72 37 60 52 44 64C35 71 27 72 22 66Z"
            fill="#ffffff"
            fillOpacity="0.9"
          />
          <path
            d="M24 74C23 80 20 85 16 88C22 88 30 84 34 78C30 78 26 77 24 74Z"
            fill="#15803d"
          />
        </svg>
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

