import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import Icon from '../components/icon'
import landscape from '../assets/farm-landscape.jpg'

const sources = [
  {
    icon: 'leaf' as const,
    name: 'BAMIS / Department of Agricultural Extension',
    kind: 'Crop calendars',
    text: 'Indicative planting windows for Aman rice, lentil, mustard, wheat and mung bean. Confirm timing locally.',
    href: 'https://www.bamis.gov.bd/en/calendar',
    action: 'Browse official crop calendars',
  },
  {
    icon: 'water' as const,
    name: 'FAO crop and soil references',
    kind: 'Crop and soil references',
    text: 'Indicative crop-water ranges and legume guidance; not field measurements or yield predictions.',
    href: 'https://www.fao.org/4/s2022e/s2022e02.htm',
    action: 'Read indicative crop-water references',
  },
  {
    icon: 'globe' as const,
    name: 'NASA POWER',
    kind: 'Historical environmental data',
    text: 'Temperature, rainfall, humidity, solar radiation and wind; historical context, not a forecast.',
    href: 'https://power.larc.nasa.gov/',
    action: 'Explore NASA POWER',
  },
  {
    icon: 'layers' as const,
    name: 'Local district references',
    kind: 'Bangladesh agriculture',
    text: 'Imported crop, soil and seasonal references. Some source dates and provenance need review.',
    href: null,
    action: null,
  },
  {
    icon: 'pin' as const,
    name: 'OpenStreetMap',
    kind: 'Location & maps',
    text: 'Optional browser location, or choose your division and district manually.',
    href: 'https://www.openstreetmap.org/copyright',
    action: 'View map attribution',
  },
  {
    icon: 'leaf' as const,
    name: 'Your farm information',
    kind: 'Your farm inputs',
    text: 'Water, soil, crop history and priorities personalize planning.',
    href: '/farms',
    action: 'Manage your farms',
  },
]

export default function Sources() {
  return (
    <div className="site-page sources-page">
      <Head title="Our data" />
      <div className="site-page-heading workspace-page-banner">
        <img src={landscape} alt="" />
        <h1>Our data</h1>
        <p>Sources and limitations behind crop plans.</p>
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
              <p className="mt-3 text-sm font-semibold text-primary">
                {source.kind}
              </p>
              <h2 className="card-title text-xl">{source.name}</h2>
              <p className="text-base leading-relaxed text-base-content">{source.text}</p>
              {source.href &&
                (source.href.startsWith('/') ? (
                  <Link href={source.href} className="agri-inline-link mt-4">
                    {source.action}
                    <Icon name="arrow" size={16} />
                  </Link>
                ) : (
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="agri-inline-link mt-4"
                  >
                    {source.action}
                    <Icon name="arrow" size={16} />
                  </a>
                ))}
            </div>
          </article>
        ))}
      </div>
      <section className="sources-note">
        <Icon name="shield" size={28} />
        <div>
          <h2>Planning guidance, not a forecast.</h2>
          <p>
            Missing crop, soil and economic data are not invented. Plans are not yield guarantees;
            confirm decisions with local agricultural advice.
          </p>
        </div>
      </section>
      <Link href="/planner" className="btn btn-neutral rounded-full">
        Open crop planner <Icon name="arrow" size={18} />
      </Link>
    </div>
  )
}
