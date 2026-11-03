import Icon from './icon'
import { generateDailyHeatmapData, type DayStressCategory } from '../lib/heatmap_data'

const categoryOrder: DayStressCategory[] = [
  'plentiful_rain',
  'optimal_moisture',
  'mild_dry',
  'high_heat',
  'extreme_drought',
]

const categories: Record<DayStressCategory, { label: string; color: string; text: string }> = {
  plentiful_rain: { label: 'Rain', color: 'bg-sky-500', text: 'text-white' },
  optimal_moisture: { label: 'Good', color: 'bg-emerald-600', text: 'text-white' },
  mild_dry: { label: 'Dry', color: 'bg-amber-300', text: 'text-amber-950' },
  high_heat: { label: 'Hot', color: 'bg-orange-500', text: 'text-white' },
  extreme_drought: { label: 'Severe', color: 'bg-red-600', text: 'text-white' },
}

function dominantCategory(days: ReturnType<typeof generateDailyHeatmapData>['days']) {
  const counts = days.reduce(
    (result, day) => {
      result[day.category] += 1
      return result
    },
    {
      plentiful_rain: 0,
      optimal_moisture: 0,
      mild_dry: 0,
      high_heat: 0,
      extreme_drought: 0,
    } satisfies Record<DayStressCategory, number>
  )

  return categoryOrder.reduce((dominant, category) =>
    counts[category] > counts[dominant] ? category : dominant
  )
}

export default function ColorCodedHeatmap() {
  const year = new Date().getFullYear()
  const months = Array.from({ length: 12 }, (_, monthIndex) =>
    generateDailyHeatmapData(monthIndex, year)
  )

  return (
    <section
      className="card border border-base-300 bg-base-100 shadow-sm"
      aria-labelledby="annual-heatmap-title"
    >
      <div className="card-body gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="annual-heatmap-title" className="text-xl font-semibold sm:text-2xl">
              {year} · Annual heatmap
            </h2>
            <p className="text-sm text-base-content/65">Typical climate</p>
          </div>
          <Icon name="sun" size={22} />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {months.map((month) => {
            const category = dominantCategory(month.days)
            const colors = categories[category]

            return (
              <article
                key={month.monthIndex}
                className={`rounded-xl p-3 sm:p-4 ${colors.color} ${colors.text}`}
                aria-label={`${month.monthName}: ${colors.label}, average ${month.avgTempC} degrees, ${month.totalRainMm} millimeters rain`}
              >
                <h3 className="font-semibold">{month.monthName.slice(0, 3)}</h3>
                <p className="mt-2 text-sm font-medium">
                  {month.avgTempC}°C <span className="opacity-80">·</span> {month.totalRainMm} mm
                </p>
              </article>
            )
          })}
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-base-content/75">
          {categoryOrder.map((category) => (
            <li key={category} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-sm ${categories[category].color}`} />
              {categories[category].label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
