import BangladeshGisMap from './bangladesh_gis_map'
import { useLocale } from '../lib/i18n'

export default function LocationMap({
  latitude,
  longitude,
  district,
}: {
  latitude: number
  longitude: number
  district: string
}) {
  const { t } = useLocale()
  const zoom = 10
  return (
    <div>
      <BangladeshGisMap latitude={latitude} longitude={longitude} district={district} compact />
      <a
        className="link block px-4 pt-2 text-xs"
        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('openLargerMap')}
      </a>
    </div>
  )
}
