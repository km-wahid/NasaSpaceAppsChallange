import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { useState } from 'react'
import { useLocale } from '../lib/i18n'
import Stat from '../components/stat'
import {
  Satellite,
  Layers,
  GitCompare,
  Sprout,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sun,
  CloudRain,
  ShieldAlert,
} from 'lucide-react'

export default function Mission() {
  const { t } = useLocale()
  const [expandedStep, setExpandedStep] = useState<number | null>(0)

  const steps = [
    {
      id: 1,
      icon: Satellite,
      title: t('missionStepObserve') || 'Observe (উপগ্রহ পর্যবেক্ষণ)',
      summary: 'Collect NASA POWER radiation and precipitation data.',
      detail:
        'Continuous orbital observations from NASA MODIS and POWER agroclimatology track 10 years of daily solar radiation, ambient temperature, and precipitation anomalies across Bangladesh.',
      source: 'NASA POWER',
    },
    {
      id: 2,
      icon: Layers,
      title: t('missionStepUnderstand') || 'Calibrate (জলবায়ু বিশ্লেষণ)',
      summary: 'Map seasonal drought, flood stress, and soil limits.',
      detail:
        'Raw satellite radiances are normalized against Bangladesh Agricultural Research Institute (BARI) agro-ecological zones and soil organic carbon baselines.',
      source: 'BARI / AEZ',
    },
    {
      id: 3,
      icon: GitCompare,
      title: t('missionStepCompare') || 'Score (গাণিতিক মূল্যায়ন)',
      summary: 'Deterministic scoring of 3-season crop combinations.',
      detail:
        'Every rotation plan is evaluated via fixed mathematical weights for soil health, water demand, and economic resilience. No AI hallucinations or randomness inside.',
      source: 'Deterministic Engine',
    },
    {
      id: 4,
      icon: Sprout,
      title: t('missionStepAct') || 'Act (বাস্তবায়ন ও আবর্তন)',
      summary: 'Deliver transparent sowing and harvest schedules.',
      detail:
        'Provides precise turnaround buffers between Kharif-1, Kharif-2, and Rabi seasons, ensuring legume recovery breaks and residue management for the farmer.',
      source: 'Farmer Decision',
    },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12">
      <Head title={t('missionTitle') || 'Mission & Methodology - OrbitAgro'} />

      {/* Header */}
      <div className="mb-10 text-center sm:text-left">
        <span className="nasa-subtitle mb-2">
          <span className="nasa-subtitle-dot" />
          SCIENTIFIC METHODOLOGY
        </span>
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-base-content mt-1">
          From Orbit to Acre
        </h1>
        <p className="mt-2 text-sm text-base-content/70 max-w-xl">
          Deterministic 4-step pipeline translating NASA Earth Observations into climate-resilient crop rotation.
        </p>
      </div>

      {/* 4-Step Stepper / Timeline with Expandable Details */}
      <div className="space-y-3 mb-12">
        {steps.map((step, idx) => {
          const Icon = step.icon
          const isExpanded = expandedStep === idx

          return (
            <div
              key={step.id}
              className={`card-modern p-4 sm:p-5 transition-all ${
                isExpanded ? 'border-success/60 bg-base-100 shadow-sm' : 'hover:border-base-300'
              }`}
            >
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setExpandedStep(isExpanded ? null : idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setExpandedStep(isExpanded ? null : idx)
                  }
                }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Step Number & Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isExpanded ? 'bg-success text-white' : 'bg-base-200 text-success'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-success">
                        STEP 0{step.id}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-base-200 text-base-content/60">
                        {step.source}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-base-content truncate mt-0.5">
                      {step.title}
                    </h3>
                    <p className="text-xs text-base-content/70 mt-0.5 truncate sm:overflow-visible sm:whitespace-normal">
                      {step.summary}
                    </p>
                  </div>
                </div>

                <div className="p-1.5 text-base-content/50 hover:text-base-content rounded-full flex-shrink-0 ml-2">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Expandable Detail */}
              {isExpanded && (
                <div className="mt-4 pt-3.5 border-t border-base-300/50 text-xs text-base-content/80 leading-relaxed animate-fade-in">
                  <p>{step.detail}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Field Realities: 3 Minimal KPI Stat Cards (1 title + 1 value + 1 label) */}
      <div className="mb-12">
        <h2 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
          <span>Observed Climate Pressures</span>
          <span className="text-xs font-mono text-base-content/50 font-normal">
            (Bogura Station Baselines)
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat
            title="Drought Stress"
            value="HIGH"
            label="Pre-monsoon dry spell watch"
            trend="up"
            trendLabel="+1.4°C"
            source="NASA POWER"
            icon={<Sun className="w-4 h-4" />}
          />
          <Stat
            title="Monsoon Rainfall"
            value="SEASONAL"
            label="1,640 mm annual average"
            trend="neutral"
            trendLabel="Stable"
            source="NASA POWER"
            icon={<CloudRain className="w-4 h-4" />}
          />
          <Stat
            title="Soil Depletion"
            value="WATCH"
            label="Intensive cereal-cereal fatigue"
            trend="down"
            trendLabel="Critical"
            source="BARI Soil Survey"
            icon={<ShieldAlert className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* CTA Box */}
      <div className="card-modern p-6 bg-base-200/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-base-content">
            Ready to test rotation scenarios?
          </h3>
          <p className="text-xs text-base-content/70 mt-1">
            Compare water requirements and soil restoration scores for your district.
          </p>
        </div>
        <Link
          href="/compare"
          className="btn-modern bg-success hover:bg-success/90 text-white text-xs font-bold whitespace-nowrap"
        >
          <span>Compare Strategies</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
