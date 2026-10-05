import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import Icon from '../components/icon'
import landscape from '../assets/farm-landscape.jpg'

const benefits = [
  {
    icon: 'water' as const,
    title: 'Work with your water.',
    text: 'Understand local seasonal patterns alongside the water available on your farm.',
    number: '01',
  },
  {
    icon: 'leaf' as const,
    title: 'Think beyond one harvest.',
    text: 'Explore multi-season rotations that consider your soil, crop history and growing windows.',
    number: '02',
  },
  {
    icon: 'sun' as const,
    title: 'Plan with perspective.',
    text: 'Compare suitable strategies and their trade-offs, guided by what matters most to you.',
    number: '03',
  },
]

export default function Home() {
  return (
    <>
      <Head title="A better perspective for every harvest" />
      <section className="agri-hero hero" aria-labelledby="hero-title">
        <img
          className="agri-hero-image"
          src={landscape}
          alt="Green fields and rolling farmland in the evening light"
          fetchPriority="high"
        />
        <div className="hero-overlay agri-hero-overlay" />
        <div className="agri-hero-content">
          <span className="agri-eyebrow">
            <span className="agri-small-dot" /> ROOTED IN YOUR FARM. INFORMED BY EARTH.
          </span>
          <h1 id="hero-title">
            A better season
            <br />
            starts with a<br />
            <em>wider view.</em>
          </h1>
          <p>
            Turn local climate, soil and water insights into a crop rotation plan that works for
            your field.
          </p>
          <div className="agri-hero-actions">
            <Link href="/planner" className="btn btn-primary agri-start-button">
              Plan my season <Icon name="arrow" size={20} />
            </Link>
            <a href="#how-it-works" className="agri-text-link">
              See how it works <Icon name="chevron" size={16} />
            </a>
          </div>
          <p className="agri-hero-reassurance">
            <Icon name="shield" size={16} /> No guesswork hidden behind a recommendation.
          </p>
        </div>
        <div className="agri-hero-caption">
          <Icon name="leaf" size={26} />
          <span>
            Built around real fields.<small>And the people who care for them.</small>
          </span>
        </div>
      </section>

      <div className="agri-context-strip">
        <span className="agri-context-intro">
          A bigger picture.
          <br />
          <strong>A more local plan.</strong>
        </span>
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
            <p className="agri-eyebrow text-primary">GROW WITH CONFIDENCE</p>
            <h2 id="benefits-title">
              Better decisions.
              <br />
              From the ground up.
            </h2>
          </div>
          <p>
            Every field has its own story. Bring your conditions and priorities into one clear view
            of the season ahead.
          </p>
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
          <p className="agri-eyebrow text-primary">SIMPLE STEPS. CLEARER SEASONS.</p>
          <h2 id="how-title">
            Your next harvest.
            <br />A thoughtful plan.
          </h2>
          <p>
            You know your farm. Orbit helps connect that knowledge with the bigger environmental
            picture.
          </p>
          <ol className="agri-how-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Start with your location</h3>
                <p>Use your location or choose your district manually. You’re always in control.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Tell us about your field</h3>
                <p>
                  Add water availability, soil information and the priorities that matter to you.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Explore your growing options</h3>
                <p>
                  See suitable rotations by month, understand the reasons and compare trade-offs.
                </p>
              </div>
            </li>
          </ol>
          <Link href="/planner" className="agri-inline-link">
            Let’s plan your season <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>

      <section className="agri-section agri-principles" aria-labelledby="principles-title">
        <div>
          <p className="agri-eyebrow text-primary">SCIENCE YOU CAN SEE</p>
          <h2 id="principles-title">
            A clear reason.
            <br />
            Behind every option.
          </h2>
          <p>
            No black box. Crop plans combine available environmental information, reviewed crop
            guidance and your farm inputs through transparent rules.
          </p>
          <Link href="/sources" className="agri-inline-link">
            Explore our data <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className="agri-principle-grid">
          {[
            {
              icon: 'shield' as const,
              title: 'Your priorities lead',
              text: 'Balance water, soil health, climate fit and economic potential.',
            },
            {
              icon: 'layers' as const,
              title: 'More than one option',
              text: 'Compare feasible rotations, not one universally “best” crop.',
            },
            {
              icon: 'info' as const,
              title: 'Honest about the gaps',
              text: 'Missing information is flagged, never filled with invented results.',
            },
            {
              icon: 'pin' as const,
              title: 'Local by design',
              text: 'District context meets your own field measurements.',
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
          Let’s grow a better
          <br />
          <em>next season.</em>
        </h2>
        <p>Start with your district. Build a plan around your farm.</p>
        <Link href="/planner" className="btn btn-neutral rounded-full min-h-12">
          Explore my growing options <Icon name="arrow" size={18} />
        </Link>
        <small>No location permission needed for manual selection.</small>
      </section>
    </>
  )
}
