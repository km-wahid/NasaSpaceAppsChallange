import { useState, useRef, useEffect, ReactNode } from 'react'
import { Info } from 'lucide-react'

interface TooltipProps {
  content: ReactNode
  children?: ReactNode
  title?: string
}

export default function Tooltip({ content, children, title }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Click outside to close on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center p-1 text-base-content/50 hover:text-success rounded-full focus:outline-none focus:ring-1 focus:ring-success"
        aria-label={title || 'Information'}
        aria-expanded={open}
      >
        {children || <Info className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-3 bg-base-100 text-base-content text-xs rounded-xl shadow-xl border border-base-300 pointer-events-auto animate-fade-in"
        >
          {title && <div className="font-semibold mb-1 text-success">{title}</div>}
          <div className="leading-relaxed text-base-content/85">{content}</div>
        </div>
      )}
    </div>
  )
}

