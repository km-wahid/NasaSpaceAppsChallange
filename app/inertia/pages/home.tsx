import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import Icon from '../components/icon'
import ColorCodedHeatmap from '../components/color_coded_heatmap'
import landscape from '../assets/farm-landscape.jpg'

const benefits = [
  {
    icon: 'water' as const,
    title: 'Water',
    text: 'Plan around seasonal water.',
    number: '01',
  },
  {
    icon: 'leaf' as const,
    title: 'Crop rotations',
    text: 'Compare crops across seasons.',
    number: '02',
  },
  {
    icon: 'sun' as const,
    title: 'Your priorities',
    text: 'Choose what matters to your farm.',
    number: '03',
  },
]

export default function Home() {
  return (
    <>
      <Head title="Home" />
      <section className="agri-hero" aria-labelledby="hero-title">
        <img
          className="agri-hero-image"
          src={landscape}
          alt="Green fields and rolling farmland in the evening light"
          fetchPriority="high"
        />
        <div className="hero-overlay agri-hero-overlay" />
        <div className="agri-hero-content">
          <h1 id="hero-title">
            Plan your
            <br />
            <em>growing season.</em>
          </h1>
          <p>Local climate, soil and water insights for your farm.</p>
          <div className="agri-hero-actions">
            <Link href="/planner" className="btn btn-primary agri-start-button">
              Plan my season <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
        <div className="agri-hero-caption">
          <Icon name="leaf" size={26} />
          <span>Built for your farm.</span>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10"
        aria-label="Annual climate heatmap"
      >
        <ColorCodedHeatmap />
      </section>

      <div className="agri-context-strip">
        <span>
          <Icon name="globe" /> NASA Earth observations
        </span>
        <span>
          <Icon name="layers" /> Local soil information
        </span>
        <span>
          <Icon name="water" /> Your water availability
        </span>
        <span>
          <Icon name="leaf" /> Your farming priorities
        </span>
      </div>

      <section className="agri-section" aria-labelledby="benefits-title">
        <div className="agri-section-heading">
          <div>
            <h2 id="benefits-title">
              Your farm.
              <br />
              Your priorities.
            </h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map((benefit) => (
            <article className="card agri-benefit-card" key={benefit.title}>
              <div className="card-body">
                <div className="agri-benefit-top">
                  <span className="agri-icon-box">
                    <Icon name={benefit.icon} size={26} />
                  </span>
                  <span>{benefit.number}</span>
                </div>
                <h3 className="card-title">{benefit.title}</h3>
                <p>{benefit.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="agri-how-section" aria-labelledby="how-title">
        <div className="agri-how-photo">
          <img
            src={landscape}
            alt="Fields with diverse planting areas across a rural landscape"
            loading="lazy"
          />
          <div>
            <Icon name="globe" size={22} />
            <span>
              From Earth observations
              <br />
              <strong>to everyday farming decisions.</strong>
            </span>
          </div>
        </div>
        <div className="agri-how-copy">
          <h2 id="how-title">
            Three steps
            <br />
            to a crop plan.
          </h2>
          <ol className="agri-how-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Choose your location</h3>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Add farm details</h3>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Compare crop rotations</h3>
              </div>
            </li>
          </ol>
          <Link href="/planner" className="agri-inline-link">
            Open crop planner <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>

      <section className="agri-section agri-principles" aria-labelledby="principles-title">
        <div>
          <h2 id="principles-title">
            Clear data.
            <br />
            Honest limits.
          </h2>
          <p>See what informs each plan and where information is missing.</p>
          <Link href="/sources" className="agri-inline-link">
            Explore our data <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className="agri-principle-grid">
          {[
            {
              icon: 'shield' as const,
              title: 'Your priorities',
              text: 'You decide what matters most.',
            },
            {
              icon: 'layers' as const,
              title: 'Compare options',
              text: 'Review suitable crop rotations.',
            },
            {
              icon: 'info' as const,
              title: 'Known data gaps',
              text: 'Missing values stay unfilled.',
            },
            {
              icon: 'pin' as const,
              title: 'Local context',
              text: 'District data and your farm inputs.',
            },
          ].map((item) => (
            <article key={item.title}>
              <Icon name={item.icon} size={25} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="agri-final-cta">
        <span className="agri-icon-box">
          <Icon name="leaf" size={28} />
        </span>
        <h2>
          Ready to plan?
        </h2>
        <Link href="/planner" className="btn btn-neutral rounded-full min-h-12">
          Open crop planner <Icon name="arrow" size={18} />
        </Link>
      </section>
    </>
  )
}
