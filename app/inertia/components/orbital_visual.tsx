import Icon from './icon'

export default function OrbitalVisual({ compact = false }: { compact?: boolean }) {
  return (
    <figure
      className={`oa-orbital-visual ${compact ? 'oa-orbital-visual-compact' : ''}`}
      aria-label="Illustrative district context map of northern Bangladesh"
    >
      <div className="oa-visual-status">
        <span className="status status-info" /> ILLUSTRATIVE VIEW
      </div>
      <svg viewBox="0 0 760 520" role="img" aria-labelledby="orbital-title orbital-desc">
        <title id="orbital-title">Illustrative district context</title>
        <desc id="orbital-desc">
          An abstract map with rivers, farm boundaries and vegetation zones.
        </desc>
        <defs>
          <linearGradient id="oa-ground" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#17334d" />
            <stop offset="1" stopColor="#173f3d" />
          </linearGradient>
          <radialGradient id="oa-crop">
            <stop stopColor="#89d7ab" stopOpacity=".8" />
            <stop offset="1" stopColor="#3e8b65" stopOpacity=".08" />
          </radialGradient>
        </defs>
        <rect width="760" height="520" rx="18" fill="url(#oa-ground)" />
        <g opacity=".14" stroke="#d7e3fc">
          <path d="M0 90h760M0 180h760M0 270h760M0 360h760M0 450h760M120 0v520M240 0v520M360 0v520M480 0v520M600 0v520" />
        </g>
        <ellipse cx="410" cy="275" rx="260" ry="190" fill="url(#oa-crop)" />
        <path
          d="M110-20c80 100 20 175 100 250s170 92 130 310"
          fill="none"
          stroke="#246bce"
          strokeOpacity=".78"
          strokeWidth="27"
        />
        <path
          d="M110-20c80 100 20 175 100 250s170 92 130 310"
          fill="none"
          stroke="#5b97fd"
          strokeOpacity=".5"
          strokeWidth="8"
        />
        <polygon
          points="350,160 482,136 536,232 455,314 330,254"
          fill="#3e8b65"
          fillOpacity=".45"
          stroke="#a4f3c6"
          strokeWidth="3"
          strokeDasharray="9 6"
        />
        <polygon
          points="555,290 660,255 700,350 604,405 530,352"
          fill="#a77b54"
          fillOpacity=".38"
          stroke="#f7c787"
          strokeWidth="2"
        />
        <polygon
          points="105,280 210,250 245,340 135,370"
          fill="#246bce"
          fillOpacity=".25"
          stroke="#5b97fd"
          strokeWidth="2"
        />
        <g transform="translate(430 227)">
          <circle r="18" fill="#071426" stroke="#fff" strokeWidth="3" />
          <circle r="6" fill="#a4f3c6" />
          <path d="M-32 0h20M12 0h20M0-32v20M0 12v20" stroke="#fff" strokeWidth="2" />
        </g>
      </svg>
      <div className="oa-map-callout oa-map-callout-health">
        <Icon name="leaf" size={18} />
        <span>
          <strong>Crop context</strong>
          <small>Stored district reference</small>
        </span>
      </div>
      <div className="oa-map-callout oa-map-callout-water">
        <Icon name="water" size={18} />
        <span>
          <strong>Soil context</strong>
          <small>Stored district reference</small>
        </span>
      </div>
      <figcaption>Illustrative view derived from stored district context</figcaption>
    </figure>
  )
}
