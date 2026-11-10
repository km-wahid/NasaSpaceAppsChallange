import { useEffect, useMemo, useState } from 'react'
import Icon from './icon'

type Position = [number, number]
type Feature = {
  properties: { name?: string }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: Position[][] | Position[][][]
  }
}
type FeatureCollection = { features: Feature[] }

const width = 260
const height = 300
const project = ([longitude, latitude]: Position) => [
  ((longitude - 88) / 5) * width,
  ((26.7 - latitude) / 6.4) * height,
]
const featurePath = (feature: Feature) => {
  const polygons =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates as Position[][]]
      : (feature.geometry.coordinates as Position[][][])
  return polygons
    .flatMap((polygon) =>
      polygon.map((ring) =>
        ring
          .map((position, index) => {
            const [x, y] = project(position)
            return `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
          })
          .join(' ')
          .concat(' Z')
      )
    )
    .join(' ')
}

export default function DistrictMiniMap({
  district,
  latitude,
  longitude,
  background = false,
}: {
  district: string
  latitude: number | null
  longitude: number | null
  background?: boolean
}) {
  const [features, setFeatures] = useState<Feature[]>([])
  useEffect(() => {
    const controller = new AbortController()
    fetch('/data/bangladesh-districts.geojson', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('DISTRICT_BOUNDARIES_UNAVAILABLE')
        return response.json() as Promise<FeatureCollection>
      })
      .then((data) => setFeatures(data.features))
      .catch(() => {
        if (!controller.signal.aborted) setFeatures([])
      })
    return () => controller.abort()
  }, [])
  const paths = useMemo(
    () =>
      features.map((feature) => ({
        name: feature.properties.name ?? '',
        path: featurePath(feature),
      })),
    [features]
  )
  const point =
    latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude)
      ? project([longitude, latitude])
      : null
  return (
    <figure
      className={`district-mini-map ${background ? 'district-mini-map-background' : ''}`}
      aria-labelledby={background ? undefined : 'district-map-title'}
      aria-hidden={background || undefined}
    >
      {!background && (
        <figcaption id="district-map-title">
          <span>
            <Icon name="map" size={17} /> Selected district
          </span>
          <strong>{district}</strong>
        </figcaption>
      )}
      {paths.length ? (
        <svg
          viewBox={`-8 -8 ${width + 16} ${height + 16}`}
          role={background ? undefined : 'img'}
          aria-label={background ? undefined : `${district} highlighted on a map of Bangladesh`}
        >
          {paths.map((item) => (
            <path
              key={item.name}
              d={item.path}
              data-selected={item.name.toLocaleLowerCase() === district.toLocaleLowerCase()}
            />
          ))}
          {point && <circle cx={point[0]} cy={point[1]} r="5" />}
        </svg>
      ) : (
        <div className="district-mini-map-fallback">
          <Icon name="pin" size={38} /> {district}
        </div>
      )}
      {!background && <p>District reference point · lightweight boundary view</p>}
    </figure>
  )
}
