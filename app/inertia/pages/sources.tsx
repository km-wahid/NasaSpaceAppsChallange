import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import Icon from '../components/icon'
import FarmScene from '../components/farm_scene'

const sources = [
  {
    icon: 'leaf' as const,
    name: 'BAMIS / Department of Agricultural Extension',
    kind: 'Crop calendars',
    takeaway: 'When crops are usually planted and harvested.',
    text: 'The starter planner covers Aman rice, lentil, mustard, wheat and mung bean. Published calendars and cultivation guidance provide indicative establishment windows and growing periods. Some references come from Bogura or Dhaka; confirm your district, variety and nursery timing locally.',
    href: 'https://www.bamis.gov.bd/en/calendar',
    action: 'Browse official crop calendars',
  },
  {
    icon: 'water' as const,
    name: 'FAO crop and soil references',
    kind: 'Screening references, not field measurements',
    takeaway: 'Typical crop water, duration and soil guidance.',
    text: 'FAO indicative crop-water and duration ranges support rice and wheat screening. FAO pulse guidance supports a potential nitrogen-fixation opportunity for legumes; benefits depend on residue and nutrient management. Numeric soil points are an explainable engine policy, not a predicted field improvement.',
    href: 'https://www.fao.org/4/s2022e/s2022e02.htm',
    action: 'Read indicative crop-water references',
  },
  {
    icon: 'globe' as const,
    name: 'NASA POWER',
    kind: 'Environmental context',
    takeaway: 'Historical weather around your farm.',
    text: 'Historical temperature, rainfall, humidity, solar radiation and wind observations are refreshed separately and stored for farm planning. They are environmental context, not a future forecast.',
    href: 'https://power.larc.nasa.gov/',
    action: 'Explore NASA POWER',
  },
  {
    icon: 'layers' as const,
    name: 'Local district references',
    kind: 'Bangladesh agriculture',
    takeaway: 'Local seasons, soil and crop context.',
    text: 'Imported district crop, soil and seasonal references support the local outlook. The workbook is Project_dataset.xlsx; source provenance and reporting dates are incomplete, so these references are flagged for review.',
    href: null,
    action: null,
  },
  {
    icon: 'pin' as const,
    name: 'OpenStreetMap',
    kind: 'Location & maps',
    takeaway: 'Connects your location to a district.',
    text: 'Browser GPS coordinates are reverse-geocoded with Nominatim. You can also select your division and district manually without granting location permission.',
    href: 'https://www.openstreetmap.org/copyright',
    action: 'View map attribution',
  },
  {
    icon: 'leaf' as const,
    name: 'Your farm information',
    kind: 'Ground-level knowledge',
    takeaway: 'Your water, soil, crop history and goals.',
    text: 'Your water availability, measured soil information, crop history and priorities help shape the planning context. Farm records are saved to your account, not browser local storage.',
    href: '/farms',
    action: 'Manage your farms',
  },
]

export default function Sources() {
  return (
    <div className="site-page sources-page">
      <Head title="Data & transparency" />
      <div className="site-page-heading workspace-page-banner">
        <div>
          <p className="agri-eyebrow text-primary">SEE WHAT SHAPES YOUR PLAN</p>
          <h1>Good decisions start with honest information.</h1>
          <p>See what we know, what you provide, and what is still unknown.</p>
          <span className="workspace-banner-note">
            <Icon name="shield" size={17} /> Clear sources. Clear limits.
          </span>
        </div>
        <FarmScene scene="data" />
      </div>
      <div className="source-pipeline" aria-label="How information becomes a crop plan">
        {[
          { label: 'Earth observations', icon: 'satellite' as const },
          { label: 'Your field', icon: 'barn' as const },
          { label: 'Your priorities', icon: 'sprout' as const },
          { label: 'Crop plan', icon: 'calendar' as const },
        ].map((step, index) => (
          <div key={step.label}>
            <span className="source-pipeline-icon"><Icon name={step.icon} size={22} /></span>
            <strong>{step.label}</strong>
            {index < 3 && <Icon name="arrow" size={18} />}
          </div>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {sources.map((source, index) => (
          <article
            key={source.name}
            className="card source-guide-card border border-base-300 bg-base-100"
          >
            <div className="card-body p-6 sm:p-8">
              <div className="source-guide-top">
                <span className="agri-icon-box">
                  <Icon name={source.icon} size={25} />
                </span>
                <span className="source-guide-number">0{index + 1}</span>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-primary">
                {source.kind}
              </p>
              <h2 className="card-title text-2xl">{source.name}</h2>
              <p className="source-takeaway">{source.takeaway}</p>
              <span
                className={`badge badge-soft mt-3 ${index === 1 || index === 3 ? 'badge-warning' : 'badge-neutral'}`}
              >
                {
                  [
                    'Historical context',
                    'General guidance',
                    'Historical context',
                    'Needs local review',
                    'Permission-based location',
                    'Provided by you',
                  ][index]
                }
              </span>
              <details className="collapse collapse-arrow mt-4 border-t border-base-300">
                <summary className="collapse-title px-0 text-sm font-semibold">See details and limits</summary>
                <div className="collapse-content px-0 text-sm leading-relaxed text-base-content/75">
                  <p>{source.text}</p>
                  {source.href &&
                    (source.href.startsWith('/') ? (
                      <Link href={source.href} className="agri-inline-link mt-4">
                        {source.action}<Icon name="arrow" size={16} />
                      </Link>
                    ) : (
                      <a href={source.href} target="_blank" rel="noreferrer" className="agri-inline-link mt-4">
                        {source.action}<Icon name="arrow" size={16} />
                      </a>
                    ))}
                </div>
              </details>
            </div>
          </article>
        ))}
      </div>
      <section className="sources-note">
        <Icon name="shield" size={28} />
        <div>
          <h2>Transparent rules. Not predictions.</h2>
          <p>
            Rotations use constraint checks, weighted scoring and sequence comparison. Reviewed crop
            requirements and calendars support season-based planning. Local yield, price and cost
            references are not available yet, so income comparisons are unavailable and all economic
            scores are neutral. Unknown water requirements, soil requirements and crop hazard
            tolerances are explicitly flagged, never replaced with invented measurements.
          </p>
          <p>
            Use these insights to support your judgement and local agricultural advice—not as a
            yield guarantee.
          </p>
        </div>
      </section>
      <Link href="/planner" className="btn btn-neutral rounded-full">
        Explore your local outlook <Icon name="arrow" size={18} />
      </Link>
    </div>
  )
}
