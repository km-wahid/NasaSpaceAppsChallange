import { useEffect, useRef, useState } from 'react'
import Icon from './icon'

/** Small, non-interactive raster preview: no canvas, WebGL or map SDK. */
export default function LocationMap({
  latitude,
  longitude,
  district,
}: {
  latitude: number
  longitude: number
  district: string
}) {
  const container = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    if (container.current) observer.observe(container.current)
    return () => observer.disconnect()
  }, [])

  const zoom = 10
  const count = 2 ** zoom
  const lat = (Math.max(-85.05112878, Math.min(85.05112878, latitude)) * Math.PI) / 180
  const x = ((longitude + 180) / 360) * count * 256
  const y = ((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * count * 256
  const left = x - width / 2
  const top = y - 235 / 2
  const tiles = []
  // Request only tiles intersecting this preview; normal browser HTTP caching applies.
  if (width && !failed) {
    for (let row = Math.floor(top / 256); row <= Math.floor((top + 234) / 256); row++) {
      if (row < 0 || row >= count) continue
      for (let col = Math.floor(left / 256); col <= Math.floor((left + width - 1) / 256); col++) {
        tiles.push(
          <img
            key={`${col}:${row}`}
            src={`https://tile.openstreetmap.org/${zoom}/${((col % count) + count) % count}/${row}.png`}
            alt=""
            width={256}
            height={256}
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute max-w-none"
            style={{ left: col * 256 - left, top: row * 256 - top }}
            onError={() => setFailed(true)}
          />
        )
      }
    }
  }
  return (
    <div>
      <div
        ref={container}
        className="relative mx-auto h-[235px] w-full max-w-lg overflow-hidden bg-base-200"
        role="img"
        aria-label={
          failed ? `Map preview unavailable for ${district}` : `Map preview of ${district}`
        }
      >
        {tiles}
        {failed ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <Icon name="pin" size={28} />
            <span>{district}</span>
            <span className="text-sm text-base-content/70" role="status">
              Map preview unavailable. Your location is still selected.
            </span>
          </div>
        ) : (
          <span
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-primary drop-shadow"
            aria-hidden="true"
          >
            <Icon name="pin" size={32} />
          </span>
        )}
      </div>
      <a
        className="link block px-4 pt-2 text-xs"
        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open larger map
      </a>
    </div>
  )
}
