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
}: {
  district: string
  latitude: number
  longitude: number
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
  const [pointX, pointY] = project([longitude, latitude])
  return (
    <figure className="district-mini-map" aria-labelledby="district-map-title">
      <figcaption id="district-map-title">
        <span>
          <Icon name="map" size={17} /> Selected district
        </span>
        <strong>{district}</strong>
      </figcaption>
      {paths.length ? (
        <svg
          viewBox={`-8 -8 ${width + 16} ${height + 16}`}
          role="img"
          aria-label={`${district} highlighted on a map of Bangladesh`}
        >
          {paths.map((item) => (
            <path
              key={item.name}
              d={item.path}
              data-selected={item.name.toLocaleLowerCase() === district.toLocaleLowerCase()}
            />
          ))}
          <circle cx={pointX} cy={pointY} r="5" />
        </svg>
      ) : (
        <div className="district-mini-map-fallback">
          <Icon name="pin" size={38} /> {district}
        </div>
      )}
      <p>District reference point · lightweight boundary view</p>
    </figure>
  )
}
