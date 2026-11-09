import { useEffect, useState } from 'react'
import SourceChip from './source_chip'
import Tooltip from './tooltip'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatProps {
  title: string
  value: string | number
  unit?: string
  label?: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  tooltip?: string
  source?: string
  sourceDetails?: string
  sourceUrl?: string
  icon?: React.ReactNode
  className?: string
}

export default function Stat({
  title,
  value,
  unit,
  label,
  trend,
  trendLabel,
  tooltip,
  source,
  sourceDetails,
  sourceUrl,
  icon,
  className = '',
}: StatProps) {
  // Animated number count-up for numbers
  const [displayValue, setDisplayValue] = useState<string | number>(
    typeof value === 'number' ? 0 : value
  )

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplayValue(value)
      return
    }

    const start = 0
    const end = value
    const duration = 600
    const startTime = performance.now()

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const current = Math.round(start + (end - start) * progress)
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(updateCounter)
      }
    }

    requestAnimationFrame(updateCounter)
  }, [value])

  return (
    <div className={`card-modern p-4 flex flex-col justify-between ${className}`}>
      {/* 1. Title + Optional Info Tooltip / Icon */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-base-content/70 flex items-center gap-1.5 truncate">
          {icon && <span className="text-success">{icon}</span>}
          {title}
        </span>
        {tooltip && <Tooltip content={tooltip} title={title} />}
      </div>

      {/* 2. Key Value (Mono font, prominent, solid colors) */}
      <div className="flex items-baseline gap-1 my-1">
        <span className="text-2xl font-bold font-mono-data text-base-content tracking-tight">
          {displayValue}
        </span>
        {unit && (
          <span className="text-xs font-mono-data text-base-content/60 font-medium">
            {unit}
          </span>
        )}

        {/* Trend Indicator (↑ / ↓) */}
        {trend && (
          <span
            className={`inline-flex items-center text-[11px] font-bold ml-auto px-1.5 py-0.5 rounded ${
              trend === 'up'
                ? 'bg-success/15 text-success'
                : trend === 'down'
                ? 'bg-error/15 text-error'
                : 'bg-base-200 text-base-content/60'
            }`}
          >
            {trend === 'up' && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
            {trend === 'down' && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {trendLabel}
          </span>
        )}
      </div>

      {/* 3. Small Label & Source Chip */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-base-300/40">
        <span className="text-[11px] text-base-content/60 truncate">
          {label}
        </span>
        {source && (
          <SourceChip source={source} details={sourceDetails} url={sourceUrl} />
        )}
      </div>
    </div>
  )
}

