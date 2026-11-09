import { useState, useRef, useEffect } from 'react'
import { Database, ExternalLink, X } from 'lucide-react'

interface SourceChipProps {
  source?: 'NASA POWER' | 'NASA MODIS' | 'BARI / BRRI' | string
  details?: string
  url?: string
}

export default function SourceChip({
  source = 'NASA POWER',
  details = 'Solar radiation, temperature anomalies, and precipitation calibrated for Bangladesh agro-climatic zones.',
  url = 'https://power.larc.nasa.gov/',
}: SourceChipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono tracking-tight font-medium rounded-md bg-base-200 hover:bg-base-300/80 text-base-content/70 hover:text-base-content border border-base-300 transition-colors"
      >
        <Database className="w-2.5 h-2.5 text-success" />
        <span>src: {source}</span>
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-72 p-3 bg-base-100 rounded-xl shadow-xl border border-base-300 text-left animate-fade-in">
          <div className="flex items-center justify-between pb-1.5 border-b border-base-300">
            <span className="font-semibold text-xs text-success flex items-center gap-1">
              <Database className="w-3.5 h-3.5" />
              {source}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 text-base-content/50 hover:text-base-content rounded-md"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-base-content/80 mt-2 leading-relaxed">
            {details}
          </p>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-success hover:underline mt-2 pt-1 border-t border-base-300/60 w-full"
            >
              <span>Explore NASA Dataset</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

