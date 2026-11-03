import { useState } from 'react'
import Icon from './icon'
import {
  generalShiftMetrics,
  seasonalShiftDetails,
  type SeasonShiftMetric,
  type SeasonalShiftDetail,
} from '../lib/climate_shift_data'

interface SeasonShiftCardProps {
  districtName?: string
}

export default function SeasonShiftCard({ districtName = 'Your District' }: SeasonShiftCardProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'seasons'>('metrics')
  const [selectedSeason, setSelectedSeason] = useState<SeasonalShiftDetail['seasonKey']>('rabi')
  const [isSpeaking, setIsSpeaking] = useState(false)

  const currentSeasonDetail =
    seasonalShiftDetails.find((s) => s.seasonKey === selectedSeason) ?? seasonalShiftDetails[0]

  function speakClimateAdvice() {
    if (!('speechSynthesis' in window)) return
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const textToSpeak = `Weather shift outlook for ${districtName}. The monsoon now arrives approximately two to three weeks later than in past decades. The winter cold window has compressed by nearly one month. To protect your harvest, plant short-duration mustard or lentils by early November immediately after the Aman harvest.`
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = 'en-US'
    utterance.rate = 0.95
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <section className="card season-shift-card border border-base-300 bg-base-100 shadow-sm" aria-labelledby="season-shift-heading">
      <div className="card-body gap-5 p-5 sm:p-7">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-amber-200 text-amber-950 border border-amber-400 font-bold gap-1.5 text-sm px-3 py-1">
                <Icon name="history" size={15} />
                Climate shift
              </span>
            </div>
            <h2 id="season-shift-heading" className="mt-2 text-2xl font-bold tracking-tight text-base-content">
              {districtName}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`btn btn-sm ${isSpeaking ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-outline border-primary text-primary hover:bg-primary hover:text-white'} font-semibold gap-1.5 rounded-lg transition-all`}
              onClick={speakClimateAdvice}
              aria-label="Listen to climate shift summary"
            >
              <Icon name="volume" size={16} />
              {isSpeaking ? 'Stop Audio' : 'Listen Advice'}
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-base-300 gap-2">
          <button
            type="button"
            className={`btn btn-sm border-b-2 rounded-b-none px-4 font-bold transition-all ${
              activeTab === 'metrics'
                ? 'border-primary text-primary bg-primary/10'
                : 'border-transparent text-base-content/75 hover:text-base-content'
            }`}
            onClick={() => setActiveTab('metrics')}
          >
            Key shifts
          </button>
          <button
            type="button"
            className={`btn btn-sm border-b-2 rounded-b-none px-4 font-bold transition-all ${
              activeTab === 'seasons'
                ? 'border-primary text-primary bg-primary/10'
                : 'border-transparent text-base-content/75 hover:text-base-content'
            }`}
            onClick={() => setActiveTab('seasons')}
          >
            By season
          </button>
        </div>

        {/* Tab 1: Key Metrics Comparison */}
        {activeTab === 'metrics' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {generalShiftMetrics.map((metric: SeasonShiftMetric) => (
              <div
                key={metric.id}
                className="card border border-base-300 bg-base-100 p-5 rounded-2xl shadow-sm transition-all hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary shrink-0">
                      <Icon name={metric.icon} size={22} />
                    </span>
                    <div>
                      <h3 className="font-bold text-base text-base-content leading-tight">{metric.title}</h3>
                    </div>
                  </div>
                  <span
                    className={`badge font-bold text-xs px-2.5 py-1 ${
                      metric.deltaType === 'alert'
                        ? 'bg-red-700 text-white'
                        : 'bg-amber-700 text-white'
                    }`}
                  >
                    {metric.delta}
                  </span>
                </div>

                {/* Then vs Now Box with Maximum Contrast */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-100 border border-slate-300 p-3 shadow-xs">
                    <span className="font-bold text-slate-600 block text-[11px] uppercase tracking-wider">
                      Then:
                    </span>
                    <p className="mt-1 font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                      {metric.thenValue}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-100 border border-amber-300 p-3 shadow-xs">
                    <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                      Now:
                    </span>
                    <p className="mt-1 font-extrabold text-amber-950 text-xs sm:text-sm leading-snug">
                      {metric.nowValue}
                    </p>
                  </div>
                </div>

                {/* Impact */}
                <p className="mt-3 text-xs text-base-content/85 leading-relaxed font-normal">
                  {metric.impactText}
                </p>

                {/* Actionable Advice Box */}
                <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs shadow-xs">
                  <span className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <Icon name="leaf" size={15} /> Action:
                  </span>
                  <p className="mt-1 font-semibold text-emerald-950 leading-relaxed">
                    {metric.farmerAction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Season by Season Detailed View */}
        {activeTab === 'seasons' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {seasonalShiftDetails.map((season) => (
                <button
                  key={season.seasonKey}
                  type="button"
                  className={`btn btn-sm rounded-lg font-bold ${
                    selectedSeason === season.seasonKey
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'btn-outline border-base-300 text-base-content hover:bg-base-200'
                  }`}
                  onClick={() => setSelectedSeason(season.seasonKey)}
                >
                  {season.name}
                </button>
              ))}
            </div>

            <div className="card border border-base-300 bg-base-100 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-200 pb-3">
                <div>
                  <h3 className="text-xl font-extrabold text-base-content">{currentSeasonDetail.name}</h3>
                  <p className="text-xs text-base-content/75 font-medium">Window: {currentSeasonDetail.period}</p>
                </div>
                <span className="badge bg-sky-100 text-sky-950 border border-sky-300 font-bold text-xs px-3 py-1">
                  Avg Temp: {currentSeasonDetail.currentProfile.avgTemp}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-300 bg-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">Historical Baseline</h4>
                    <span className="badge bg-slate-200 text-slate-900 border border-slate-400 font-bold text-xs">
                      {currentSeasonDetail.historicalProfile.durationDays} Days
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-800 font-medium">
                    {currentSeasonDetail.historicalProfile.rainfallPattern}
                  </p>
                  <p className="mt-2 text-xs text-emerald-800 font-bold">
                    ✓ {currentSeasonDetail.historicalProfile.keyAdvantage}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-300 bg-amber-100 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-amber-950">Current Climate Trend</h4>
                    <span className="badge bg-amber-300 text-amber-950 border border-amber-500 font-bold text-xs">
                      {currentSeasonDetail.currentProfile.durationDays} Days (Compressed)
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-amber-950 font-medium">
                    {currentSeasonDetail.currentProfile.rainfallPattern}
                  </p>
                  <p className="mt-2 text-xs text-red-800 font-bold">
                    ⚠️ {currentSeasonDetail.currentProfile.mainChallenge}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-emerald-100 border border-emerald-400 p-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <Icon name="leaf" size={16} /> Recommended Adaptation Strategy:
                </h4>
                <p className="mt-1 text-sm font-bold text-emerald-950 leading-relaxed">
                  {currentSeasonDetail.recommendedCropStrategy}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 text-xs text-base-content/75 font-medium">
          <Icon name="info" size={15} />
          <span>
            Source: Historical climate and NASA observations.
          </span>
        </div>
      </div>
    </section>
  )
}
