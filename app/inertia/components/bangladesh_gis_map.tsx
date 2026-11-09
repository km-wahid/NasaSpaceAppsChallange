import { useEffect, useRef, useState } from 'react'
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import { useLocale } from '../lib/i18n'

type LayerKey = 'vegetation' | 'moisture' | 'heat'
type ClimateMetric = 'temperature' | 'rainfall'

export type RegionalClimatePoint = {
  latitude: number
  longitude: number
  temperatureC: Array<number | null>
  rainfallMm: Array<number | null>
}

type Props = {
  latitude: number
  longitude: number
  district: string
  accuracy?: number | null
  layers?: Record<LayerKey, boolean>
  opacity?: number
  compact?: boolean
  districtClimate?: Array<{ district_name: string; mean_rainfall_mm: string }>
  satellite?: boolean
  satelliteDate?: string
  climateGrid?: RegionalClimatePoint[]
  climateMetric?: ClimateMetric
  climateIndex?: number
}

const BANGLADESH_BOUNDS: [[number, number], [number, number]] = [
  [20.3, 87.7],
  [26.8, 93.1],
]

const DISTRICT_ALIASES: Record<string, string> = {
  barisal: 'barishal',
  bogra: 'bogura',
  brahamanbaria: 'brahmanbaria',
  chittagong: 'chattogram',
  comilla: 'cumilla',
  jessore: 'jashore',
  maulvibazar: 'moulvibazar',
  nawabganj: 'chapainawabganj',
}

const normalizeDistrict = (name: string) => {
  const normalized = name.toLowerCase().replace(/[^a-z]/g, '')
  return DISTRICT_ALIASES[normalized] ?? normalized
}

const rainfallColor = (value: number | null) => {
  if (value === null) return '#d1d5db'
  if (value > 1_000) return '#08519c'
  if (value > 750) return '#3182bd'
  if (value > 500) return '#6baed6'
  if (value > 250) return '#9ecae1'
  if (value > 100) return '#c6dbef'
  return '#eff3ff'
}

const climateColor = (metric: ClimateMetric, value: number) => {
  if (metric === 'temperature') {
    const ratio = Math.max(0, Math.min(1, (value - 14) / 20))
    return `hsl(${Math.round(155 - ratio * 150)} 74% ${Math.round(80 - ratio * 36)}%)`
  }
  const ratio = Math.max(0, Math.min(1, value / 650))
  return `hsl(${Math.round(198 + ratio * 18)} ${Math.round(52 + ratio * 30)}% ${Math.round(92 - ratio * 52)}%)`
}

const geometryCenter = (geometry: Geometry): [number, number] | null => {
  const coordinates =
    geometry.type === 'Polygon'
      ? geometry.coordinates[0]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates.flatMap((polygon) => polygon[0])
        : []
  if (!coordinates.length) return null
  const [longitude, latitude] = coordinates.reduce(
    ([longitudeSum, latitudeSum], [longitudeValue, latitudeValue]) => [
      longitudeSum + longitudeValue,
      latitudeSum + latitudeValue,
    ],
    [0, 0]
  )
  return [longitude / coordinates.length, latitude / coordinates.length]
}

export default function BangladeshGisMap({
  latitude,
  longitude,
  district,
  accuracy,
  layers,
  opacity = 72,
  compact = false,
  districtClimate,
  satellite = false,
  satelliteDate,
  climateGrid,
  climateMetric = 'temperature',
  climateIndex,
}: Props) {
  const { t } = useLocale()
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<import('leaflet').Map | null>(null)
  const leaflet = useRef<typeof import('leaflet') | null>(null)
  const overlays = useRef<import('leaflet').LayerGroup | null>(null)
  const choropleth = useRef<import('leaflet').GeoJSON | null>(null)
  const satelliteTiles = useRef<import('leaflet').TileLayer | null>(null)
  const climateOverlay = useRef<import('leaflet').LayerGroup | null>(null)
  const opacityRef = useRef(opacity)
  opacityRef.current = opacity
  const [failed, setFailed] = useState(false)
  const [boundaryFailed, setBoundaryFailed] = useState(false)
  const [mapVersion, setMapVersion] = useState(0)
  const [satelliteFailed, setSatelliteFailed] = useState(false)
  const overview = Boolean(districtClimate || climateGrid)

  useEffect(() => {
    let disposed = false
    let observer: ResizeObserver | null = null

    void import('leaflet').then((L) => {
      if (disposed || !container.current) return
      leaflet.current = L
      const nextMap = L.map(container.current, {
        attributionControl: true,
        minZoom: 6,
        maxBounds: BANGLADESH_BOUNDS,
        maxBoundsViscosity: 0.8,
        preferCanvas: true,
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        keyboard: true,
      }).setView(overview ? [23.7, 90.35] : [latitude, longitude], overview ? 7 : compact ? 10 : 11)

      if (overview) {
        nextMap.fitBounds(BANGLADESH_BOUNDS, { padding: [20, 20] })
      }

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      })
        .on('tileerror', () => setFailed(true))
        .addTo(nextMap)

      if (accuracy && accuracy > 0) {
        L.circle([latitude, longitude], {
          radius: accuracy,
          color: '#246bce',
          fillColor: '#5b97fd',
          fillOpacity: 0.12,
          weight: 1,
        }).addTo(nextMap)
      }

      L.circleMarker([latitude, longitude], {
        radius: compact ? 8 : 10,
        color: '#ffffff',
        fillColor: '#0f6b45',
        fillOpacity: 1,
        weight: 3,
      })
        .bindTooltip(district, { direction: 'top', offset: [0, -8] })
        .addTo(nextMap)

      overlays.current = L.layerGroup().addTo(nextMap)
      map.current = nextMap
      setMapVersion((version) => version + 1)
      observer = new ResizeObserver(() => nextMap.invalidateSize({ pan: false }))
      observer.observe(container.current)
    })

    return () => {
      disposed = true
      observer?.disconnect()
      map.current?.remove()
      map.current = null
      overlays.current = null
      leaflet.current = null
    }
  }, [accuracy, compact, district, districtClimate, latitude, longitude, overview])

  useEffect(() => {
    const L = leaflet.current
    const nextMap = map.current
    satelliteTiles.current?.remove()
    satelliteTiles.current = null
    setSatelliteFailed(false)
    if (!L || !nextMap || !satellite || !satelliteDate) return
    const layer = L.tileLayer(
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${satelliteDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      {
        attribution: 'Satellite imagery: NASA EOSDIS GIBS / MODIS Terra',
        maxNativeZoom: 9,
        maxZoom: 18,
      }
    )
      .on('tileerror', () => setSatelliteFailed(true))
      .addTo(nextMap)
    satelliteTiles.current = layer
    return () => {
      layer.remove()
      if (satelliteTiles.current === layer) satelliteTiles.current = null
    }
  }, [mapVersion, satellite, satelliteDate])

  useEffect(() => {
    const L = leaflet.current
    const nextMap = map.current
    climateOverlay.current?.remove()
    climateOverlay.current = null
    if (!L || !nextMap || !climateGrid?.length || climateIndex === undefined || climateIndex < 0)
      return
    const controller = new AbortController()
    const group = L.layerGroup()
    let legend: import('leaflet').Control | null = null
    const render = (boundaries?: FeatureCollection<Geometry, { name: string }>) => {
      const values: number[] = []
      const valueForPoint = (point: RegionalClimatePoint) =>
        climateMetric === 'temperature'
          ? point.temperatureC[climateIndex]
          : point.rainfallMm[climateIndex]
      if (boundaries) {
        const districtValues = new Map<string, number>()
        for (const feature of boundaries.features) {
          const center = geometryCenter(feature.geometry)
          if (!center) continue
          const nearest = climateGrid.reduce((closest, point) => {
            const distance = (point.longitude - center[0]) ** 2 + (point.latitude - center[1]) ** 2
            const closestDistance =
              (closest.longitude - center[0]) ** 2 + (closest.latitude - center[1]) ** 2
            return distance < closestDistance ? point : closest
          })
          const value = valueForPoint(nearest)
          if (value === null || !Number.isFinite(value)) continue
          districtValues.set(feature.properties.name, value)
          values.push(value)
        }
        L.geoJSON(boundaries, {
          style: (feature) => {
            const value = districtValues.get(String(feature?.properties?.name))
            return {
              color: '#ffffff',
              fillColor: value === undefined ? '#d1d5db' : climateColor(climateMetric, value),
              fillOpacity: Math.max(0.52, opacity / 112),
              opacity: 0.9,
              weight: 1,
            }
          },
          onEachFeature: (feature, layer) => {
            const name = String(feature.properties?.name ?? 'District')
            const value = districtValues.get(name)
            const unit = climateMetric === 'temperature' ? '°C' : ' mm'
            layer.bindTooltip(
              `${name}: ${value === undefined ? 'No data' : `${value.toFixed(1)}${unit}`} · nearest NASA grid`,
              { sticky: true }
            )
          },
        }).addTo(group)
      } else {
        for (const point of climateGrid) {
          const value = valueForPoint(point)
          if (value === null || !Number.isFinite(value)) continue
          values.push(value)
          const unit = climateMetric === 'temperature' ? '°C' : ' mm'
          L.rectangle(
            [
              [point.latitude - 0.25, point.longitude - 0.3125],
              [point.latitude + 0.25, point.longitude + 0.3125],
            ],
            {
              color: climateColor(climateMetric, value),
              fillColor: climateColor(climateMetric, value),
              fillOpacity: Math.max(0.42, opacity / 112),
              opacity: 0.9,
              weight: 1,
            }
          )
            .bindTooltip(`${value.toFixed(1)}${unit} · NASA grid estimate`, { sticky: true })
            .addTo(group)
        }
      }
      group.addTo(nextMap)
      climateOverlay.current = group
      legend = new L.Control({ position: 'bottomleft' })
      legend.onAdd = () => {
        const body = L.DomUtil.create('div', 'oa-climate-map-legend bg-white/95 border border-slate-300 rounded-xl p-2.5 shadow-md')
        const title = document.createElement('strong')
        title.className = 'block text-xs font-bold text-slate-800 mb-1'
        const scale = document.createElement('i')
        scale.className = `block h-2 rounded w-full my-1.5 ${climateMetric}`
        const labels = document.createElement('div')
        labels.className = 'flex items-center justify-between gap-3 text-[11px] font-mono font-bold text-slate-700'
        const minimum = values.length ? Math.min(...values) : 0
        const maximum = values.length ? Math.max(...values) : 0
        const unit = climateMetric === 'temperature' ? '°C' : ' mm'
        title.textContent =
          climateMetric === 'temperature' ? 'Monthly mean temperature' : 'Monthly rainfall'
        labels.innerHTML = `<span>Min: ${minimum.toFixed(1)}${unit}</span><span class="text-slate-400">—</span><span>Max: ${maximum.toFixed(1)}${unit}</span>`
        body.append(title, scale, labels)
        return body
      }
      legend.addTo(nextMap)
    }
    void fetch('/data/bangladesh-districts.geojson', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Boundary request failed (${response.status})`)
        return response.json() as Promise<FeatureCollection<Geometry, { name: string }>>
      })
      .then(render)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) render()
      })
    return () => {
      controller.abort()
      group.remove()
      legend?.remove()
      if (climateOverlay.current === group) climateOverlay.current = null
    }
  }, [climateGrid, climateIndex, climateMetric, mapVersion, opacity])

  useEffect(() => {
    const L = leaflet.current
    const nextMap = map.current
    if (!L || !nextMap || !districtClimate) return

    const controller = new AbortController()
    let districtLayer: import('leaflet').GeoJSON | null = null
    let infoControl: import('leaflet').Control | null = null
    let legendControl: import('leaflet').Control | null = null
    const values = new Map(
      districtClimate.map((row) => [
        normalizeDistrict(row.district_name),
        Number.isFinite(Number(row.mean_rainfall_mm)) ? Number(row.mean_rainfall_mm) : null,
      ])
    )
    const valueFor = (name: string) => values.get(normalizeDistrict(name)) ?? null

    void fetch('/data/bangladesh-districts.geojson', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Boundary request failed (${response.status})`)
        return response.json() as Promise<FeatureCollection<Geometry, { name: string }>>
      })
      .then((boundaries) => {
        if (controller.signal.aborted) return
        let infoBody: HTMLDivElement
        let selectedPath: import('leaflet').Path | null = null
        let selectedProperties: { name: string } | undefined
        const updateInfo = (properties?: { name: string }) => {
          infoBody.replaceChildren()
          const title = document.createElement('strong')
          title.textContent = t('meanSeasonalRainfall')
          const detail = document.createElement('span')
          const value = properties ? valueFor(properties.name) : null
          detail.textContent = properties
            ? `${properties.name}: ${value === null ? t('noRainfallData') : `${Math.round(value)} mm`}`
            : t('hoverDistrict')
          infoBody.append(title, detail)
        }

        const nextInfoControl = new L.Control({ position: 'topright' })
        nextInfoControl.onAdd = () => {
          infoBody = L.DomUtil.create('div', 'oa-choropleth-info')
          updateInfo()
          return infoBody
        }
        nextInfoControl.addTo(nextMap)
        infoControl = nextInfoControl

        districtLayer = L.geoJSON(boundaries, {
          style: (feature) => {
            const name = String(feature?.properties?.name ?? '')
            return {
              color:
                normalizeDistrict(name) === normalizeDistrict(district) ? '#071426' : '#ffffff',
              dashArray: '3',
              fillColor: rainfallColor(valueFor(name)),
              fillOpacity: Math.max(0.35, opacityRef.current / 100),
              weight: normalizeDistrict(name) === normalizeDistrict(district) ? 3 : 1.5,
            }
          },
          onEachFeature: (
            feature: Feature<Geometry, GeoJsonProperties>,
            layer: import('leaflet').Layer
          ) => {
            const path = layer as import('leaflet').Path & {
              getBounds: () => import('leaflet').LatLngBounds
            }
            const properties = feature.properties as { name: string }
            const rainfall = valueFor(properties.name)
            const detail = `${properties.name}: ${rainfall === null ? t('noRainfallData') : `${Math.round(rainfall)} mm`}`
            path.bindTooltip(detail, { sticky: true })
            const popup = document.createElement('div')
            const popupTitle = document.createElement('strong')
            const popupDetail = document.createElement('span')
            popupTitle.textContent = properties.name
            popupDetail.textContent =
              rainfall === null
                ? t('noRainfallData')
                : `${t('meanSeasonalRainfall')}: ${Math.round(rainfall)} mm`
            popup.append(popupTitle, popupDetail)
            path.bindPopup(popup, { closeButton: true, maxWidth: 240 })
            path.on({
              mouseover: () => {
                path.setStyle({ color: '#263238', dashArray: '', fillOpacity: 0.86, weight: 4 })
                path.bringToFront()
                updateInfo(properties)
              },
              mouseout: () => {
                if (path !== selectedPath) districtLayer?.resetStyle(path)
                updateInfo(selectedProperties)
              },
              click: () => {
                if (selectedPath && selectedPath !== path) districtLayer?.resetStyle(selectedPath)
                selectedPath = path
                selectedProperties = properties
                path.setStyle({ color: '#071426', dashArray: '', fillOpacity: 0.9, weight: 5 })
                path.bringToFront()
                updateInfo(properties)
                nextMap.fitBounds(path.getBounds(), { maxZoom: 10, padding: [24, 24] })
              },
            })
          },
        }).addTo(nextMap)
        districtLayer.bringToBack()
        choropleth.current = districtLayer

        const nextLegendControl = new L.Control({ position: 'bottomright' })
        nextLegendControl.onAdd = () => {
          const legend = L.DomUtil.create('div', 'oa-choropleth-legend')
          const title = document.createElement('strong')
          title.textContent = t('rainfallChoropleth')
          legend.append(title)
          const grades = [0, 100, 250, 500, 750, 1_000]
          grades.forEach((grade, index) => {
            const row = document.createElement('span')
            const swatch = document.createElement('i')
            swatch.style.background = rainfallColor(grade + 1)
            const next = grades[index + 1]
            row.append(swatch, `${grade}${next ? `–${next}` : '+'} mm`)
            legend.append(row)
          })
          const missing = document.createElement('span')
          const missingSwatch = document.createElement('i')
          missingSwatch.style.background = rainfallColor(null)
          missing.append(missingSwatch, t('noRainfallData'))
          legend.append(missing)
          return legend
        }
        nextLegendControl.addTo(nextMap)
        legendControl = nextLegendControl
        nextMap.attributionControl?.addAttribution(
          '<a href="https://www.geoboundaries.org/" target="_blank" rel="noopener">District boundaries: geoBoundaries / BBS / OCHA</a>'
        )
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setBoundaryFailed(true)
      })

    return () => {
      controller.abort()
      districtLayer?.remove()
      choropleth.current = null
      infoControl?.remove()
      legendControl?.remove()
    }
  }, [district, districtClimate, mapVersion, t])

  useEffect(() => {
    choropleth.current?.setStyle({ fillOpacity: Math.max(0.35, opacity / 100) })
  }, [opacity])

  useEffect(() => {
    const L = leaflet.current
    const group = overlays.current
    if (!L || !group || !layers) return
    group.clearLayers()
    const fillOpacity = Math.max(0.08, Math.min(0.42, opacity / 240))
    const contexts: Array<{
      active: boolean
      center: [number, number]
      radius: number
      color: string
      fillColor: string
      label: string
    }> = [
      {
        active: layers.vegetation,
        center: [latitude + 0.025, longitude + 0.02],
        radius: 7_500,
        color: '#2f9e67',
        fillColor: '#57e0a5',
        label: t('modeledCropContext'),
      },
      {
        active: layers.moisture,
        center: [latitude - 0.035, longitude - 0.035],
        radius: 5_500,
        color: '#246bce',
        fillColor: '#5b97fd',
        label: t('modeledWaterContext'),
      },
      {
        active: layers.heat,
        center: [latitude + 0.045, longitude - 0.045],
        radius: 6_500,
        color: '#d97706',
        fillColor: '#f4a261',
        label: t('modeledHeatContext'),
      },
    ]
    contexts.forEach((context) => {
      if (!context.active) return
      L.circle(context.center, {
        radius: context.radius,
        color: context.color,
        fillColor: context.fillColor,
        fillOpacity,
        weight: 2,
      })
        .bindTooltip(context.label)
        .addTo(group)
    })
  }, [latitude, layers, longitude, mapVersion, opacity, t])

  return (
    <div className={`w-full h-full relative flex-1 oa-map ${compact ? 'min-h-[380px] md:min-h-[460px]' : 'oa-map-full'}`}>
      <div
        ref={container}
        className="w-full h-full min-h-[inherit] oa-map-surface"
        role="region"
        aria-label={
          failed ? `${t('mapUnavailable')} ${district}` : `${t('mapPreview')} ${district}`
        }
      />
      {failed && (
        <div className="oa-map-fallback" role="status">
          {t('tileUnavailable')}
        </div>
      )}
      {boundaryFailed && (
        <div className="oa-map-boundary-error alert alert-warning" role="status">
          {t('boundaryUnavailable')}
        </div>
      )}
      {satelliteFailed && satellite && (
        <div className="oa-map-fallback" role="status">
          NASA satellite tiles are temporarily unavailable; the reference map remains visible.
        </div>
      )}
    </div>
  )
}
