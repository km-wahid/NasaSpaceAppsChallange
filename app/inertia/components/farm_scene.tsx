import Icon from './icon'

type Scene = 'hero' | 'location' | 'farm' | 'data' | 'auth'

const sceneIcon: Record<Scene, Parameters<typeof Icon>[0]['name']> = {
  hero: 'sprout',
  location: 'pin',
  farm: 'barn',
  data: 'satellite',
  auth: 'shield',
}

export default function FarmScene({
  scene = 'hero',
  className = '',
}: {
  scene?: Scene
  className?: string
}) {
  return (
    <div className={`farm-scene farm-scene-${scene} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 720 520" role="presentation">
        <defs>
          <linearGradient id={`sky-${scene}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--scene-sky)" />
            <stop offset="1" stopColor="var(--scene-sky-low)" />
          </linearGradient>
          <linearGradient id={`field-${scene}`} x1="0" x2="1">
            <stop stopColor="var(--scene-field)" />
            <stop offset="1" stopColor="var(--scene-field-light)" />
          </linearGradient>
        </defs>
        <rect width="720" height="520" rx="32" fill={`url(#sky-${scene})`} />
        <circle className="farm-scene-sun" cx="590" cy="106" r="47" fill="var(--scene-sun)" />
        <g className="farm-scene-cloud" fill="var(--scene-cloud)">
          <ellipse cx="125" cy="105" rx="55" ry="20" />
          <circle cx="105" cy="91" r="22" />
          <circle cx="139" cy="87" r="27" />
        </g>
        <path
          d="M0 297C112 224 202 248 302 287c90 35 180-26 272-42 56-10 105 4 146 28v247H0Z"
          fill="var(--scene-hill)"
        />
        <path
          d="M0 346c134-62 241-38 349 8 124 52 242-16 371-39v205H0Z"
          fill={`url(#field-${scene})`}
        />
        <path d="M0 418c151-52 277-42 381 3 105 46 212 25 339-18v117H0Z" fill="var(--scene-soil)" />
        <g
          className="farm-scene-rows"
          fill="none"
          stroke="var(--scene-row)"
          strokeWidth="8"
          strokeLinecap="round"
        >
          <path d="M36 475c115-39 211-31 311 5" />
          <path d="M212 440c130-35 262-24 414 27" />
          <path d="M405 400c93-16 179-8 279 21" />
        </g>
        <g
          className="farm-scene-plants"
          stroke="var(--scene-plant)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {[120, 215, 310, 500, 600].map((x, index) => (
            <g key={x} transform={`translate(${x} ${390 + (index % 2) * 28})`}>
              <path d="M0 25V-18" />
              <path d="M0 4c-24-3-31-18-32-31 22 0 33 9 32 31Z" fill="var(--scene-leaf)" />
              <path d="M0-4c24-3 31-18 32-31-22 0-33 9-32 31Z" fill="var(--scene-leaf-light)" />
            </g>
          ))}
        </g>
        <g className="farm-scene-hut" transform="translate(430 252)">
          <path d="m0 55 72-55 72 55" fill="var(--scene-roof)" />
          <rect x="16" y="51" width="112" height="76" rx="5" fill="var(--scene-hut)" />
          <rect x="61" y="82" width="28" height="45" rx="3" fill="var(--scene-door)" />
        </g>
        {scene === 'farm' && (
          <g className="farm-scene-animals">
            <g className="farm-scene-cow" transform="translate(280 352) scale(1.12)">
              <ellipse cx="39" cy="24" rx="38" ry="23" fill="var(--color-base-100)" />
              <path
                d="M10 12c12 4 16 16 16 30M48 5c6 8 8 19 5 38"
                fill="none"
                stroke="var(--color-neutral)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <ellipse cx="75" cy="17" rx="19" ry="15" fill="var(--color-base-100)" />
              <path
                d="m67 4-8-8m25 10 9-7M69 17h1m12 0h1"
                fill="none"
                stroke="var(--color-neutral)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M16 44v18m43-18v18"
                stroke="var(--color-neutral)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path d="M19 11c11-9 19 4 23 12-12 6-23 2-23-12Z" fill="var(--color-neutral)" />
            </g>
            <g
              className="farm-scene-ducks"
              fill="var(--scene-sun)"
              stroke="var(--color-neutral)"
              strokeWidth="3"
              strokeLinejoin="round"
            >
              <path d="M121 342c14-12 30-2 28 12 14-5 25 2 27 14-27 12-55 9-62-7-3-8 0-14 7-19Z" />
              <path d="M168 374c10-9 23-1 21 10 11-4 20 2 21 11-21 9-43 7-48-6-3-6 0-11 6-15Z" />
            </g>
          </g>
        )}
        <g className="farm-scene-water" transform="translate(38 300)">
          <path d="M0 62c55-25 108-25 165 0-55 26-110 26-165 0Z" fill="var(--scene-water)" />
          <path
            d="M35 61c28-10 61-10 94 0"
            fill="none"
            stroke="var(--scene-water-line)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <span className="farm-scene-badge">
        <Icon name={sceneIcon[scene]} size={22} />
      </span>
    </div>
  )
}
