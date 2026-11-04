export type EarthLayer = 'temperature' | 'climate' | 'soil' | 'rainfall'

export default function EarthLayerVisual({ layer, label }: { layer: EarthLayer; label: string }) {
  const landPath =
    'M300 52 348 66 371 101 407 113 419 151 402 184 422 215 394 244 371 299 334 322 304 294 279 257 251 236 246 198 218 165 234 126 261 105 268 70Z'

  return (
    <figure className={`oa-earth-layer oa-earth-layer-${layer}`}>
      <svg viewBox="0 0 640 360" role="img" aria-label={label}>
        <title>{label}</title>
        <defs>
          <linearGradient id={`${layer}-surface`} x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="var(--layer-start)" />
            <stop offset="1" stopColor="var(--layer-end)" />
          </linearGradient>
          <clipPath id={`${layer}-land`}>
            <path d={landPath} />
          </clipPath>
        </defs>
        <rect width="640" height="360" fill="var(--layer-ocean)" />
        <g className="oa-earth-grid">
          {[80, 160, 240, 320, 400, 480, 560].map((x) => (
            <path key={`x-${x}`} d={`M${x} 0v360`} />
          ))}
          {[60, 120, 180, 240, 300].map((y) => (
            <path key={`y-${y}`} d={`M0 ${y}h640`} />
          ))}
        </g>
        <path className="oa-orbit-line" d="M-30 292C156 55 390 18 684 118" />
        <g className="oa-layer-land" clipPath={`url(#${layer}-land)`}>
          <rect x="210" y="45" width="225" height="290" fill={`url(#${layer}-surface)`} />
          {layer === 'temperature' && (
            <>
              <circle cx="286" cy="138" r="54" />
              <circle cx="359" cy="190" r="70" />
              <circle cx="318" cy="270" r="47" />
            </>
          )}
          {layer === 'climate' && (
            <>
              <path d="M220 273c49-4 57-95 101-82 42 12 46-73 100-87" />
              <path d="M220 301c54-40 91-22 123-70 28-42 47-24 78-85" />
            </>
          )}
          {layer === 'soil' && (
            <>
              <path d="M205 120c57 27 101 17 229-15v55c-89 31-155 34-229 8Z" />
              <path d="M205 211c92-29 146-23 229 7v56c-85-24-153-20-229 8Z" />
            </>
          )}
          {layer === 'rainfall' && (
            <>
              {[246, 286, 326, 366, 406].map((x, index) => (
                <path key={x} d={`M${x} ${82 + index * 18}l-33 78`} />
              ))}
              <circle cx="292" cy="248" r="42" />
              <circle cx="369" cy="204" r="52" />
            </>
          )}
        </g>
        <path className="oa-layer-outline" d={landPath} />
        <g className="oa-layer-satellite" transform="translate(94 72) rotate(-16)">
          <rect x="-17" y="-11" width="34" height="22" rx="4" />
          <path d="M-48-18h24v36h-24zM24-18h24v36H24zM0 11v24m-10 0h20" />
        </g>
        <g className="oa-layer-legend" transform="translate(32 302)">
          <rect width="164" height="12" rx="6" fill={`url(#${layer}-surface)`} />
          <circle cx="0" cy="6" r="3" />
          <circle cx="164" cy="6" r="3" />
        </g>
      </svg>
    </figure>
  )
}
