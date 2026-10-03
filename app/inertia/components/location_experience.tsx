import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { api } from '../lib/api'
import {
  detectUserLocation,
  LocationDetectionError,
  type LocationProgress,
  type UserLocation,
} from '../lib/location'
import Icon from './icon'

type LocationState =
  | 'idle'
  | LocationProgress
  | 'success'
  | 'permission-denied'
  | 'location-unavailable'
  | 'geocoding-error'
type Props = {
  signedIn: boolean
  districts: Array<{ district_id: string; district_name: string; division_id: string }>
  divisions: Array<{ division_id: string; division_name: string }>
  onContinue: (location: UserLocation) => void
  title?: string
  description?: string
  buttonText?: string
  accentColor?: string
  borderRadius?: number
  animationIntensity?: 'subtle' | 'none'
  backgroundStyle?: 'grid' | 'plain'
}

const headings: Record<LocationState, string> = {
  'idle': 'Let’s find your location',
  'requesting-permission': 'Finding your location…',
  'detecting': 'Finding your location…',
  'reverse-geocoding': 'Getting local information…',
  'success': 'Location found',
  'permission-denied': 'Location access is off',
  'location-unavailable': 'Location isn’t available',
  'geocoding-error': 'We couldn’t determine your district',
}

export default function LocationExperience({
  signedIn,
  districts,
  divisions,
  onContinue,
  title = 'Let’s find your location',
  description = 'We use your location to provide local climate and agricultural insights.',
  buttonText = 'Use my location',
  accentColor = '#246349',
  borderRadius = 24,
  animationIntensity = 'subtle',
  backgroundStyle = 'grid',
}: Props) {
  const id = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  const request = useRef<AbortController | null>(null)
  const [state, setState] = useState<LocationState>('idle')
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [restoring, setRestoring] = useState(signedIn)
  const [saving, setSaving] = useState(false)
  const [manual, setManual] = useState(false)
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [message, setMessage] = useState('')
  const detecting = ['requesting-permission', 'detecting', 'reverse-geocoding'].includes(state)
  const busy = detecting || saving || restoring
  const isError = ['permission-denied', 'location-unavailable', 'geocoding-error'].includes(state)

  useEffect(() => {
    if (!signedIn) return
    setRestoring(true)
    const controller = new AbortController()
    api<UserLocation | null>('/api/v1/location', 'GET', undefined, controller.signal)
      .then((saved) => {
        if (controller.signal.aborted || !saved) return
        setLocation(saved)
        if (saved.districtId) {
          setState('success')
          setExpanded(false)
          onContinue(saved)
        } else
          setMessage(
            'Your saved coordinates have no supported district. Please choose a district manually.'
          )
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setMessage(
            'Your saved location could not be loaded. You can try detection or choose a district below.'
          )
      })
      .finally(() => {
        if (!controller.signal.aborted) setRestoring(false)
      })
    return () => controller.abort()
  }, [signedIn, onContinue])

  useEffect(
    () => () => {
      request.current?.abort()
      request.current = null
    },
    []
  )
  useEffect(() => {
    if (expanded && (state === 'success' || isError || manual)) heading.current?.focus()
  }, [state, manual, expanded, isError])

  async function detect() {
    if (busy || request.current) return
    setManual(false)
    setMessage('')
    const controller = new AbortController()
    request.current = controller
    try {
      const result = await detectUserLocation(controller.signal, setState)
      if (controller.signal.aborted) return
      setLocation(result)
      if (!result.districtId) {
        setState('geocoding-error')
        setMessage(
          'Your coordinates were found, but no supported Bangladesh district matched. Please choose your district manually.'
        )
        return
      }
      setState('success')
    } catch (error) {
      if (controller.signal.aborted) return
      setState(error instanceof LocationDetectionError ? error.state : 'geocoding-error')
      setMessage(
        error instanceof Error ? error.message : 'Please try again or choose a district manually.'
      )
    } finally {
      if (request.current === controller) request.current = null
    }
  }

  async function chooseDistrict() {
    const district = districts.find(
      (item) => String(item.district_id) === districtId && String(item.division_id) === divisionId
    )
    if (!district || busy) return
    setSaving(true)
    setMessage('')
    try {
      const selected: UserLocation = signedIn
        ? await api<UserLocation>('/api/v1/location', 'PUT', { districtId })
        : {
            latitude: null,
            longitude: null,
            district: district.district_name,
            districtId,
            division:
              divisions.find((item) => String(item.division_id) === divisionId)?.division_name ??
              null,
            country: 'Bangladesh',
            countryCode: 'bd',
          }
      setLocation(selected)
      setManual(false)
      setState('success')
    } catch (error) {
      setState('geocoding-error')
      setMessage(
        error instanceof Error
          ? error.message
          : 'Your location could not be saved. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  function proceed() {
    if (!location?.districtId) return
    onContinue(location)
    setExpanded(false)
  }

  if (!expanded && location)
    return (
      <section className="location-summary" aria-label="Your location">
        <span className="location-summary-pin">
          <Icon name="pin" />
        </span>
        <div>
          <span>{signedIn ? 'YOUR SAVED LOCATION' : 'YOUR LOCAL VIEW'}</span>
          <strong>
            {location.district}
            <small>
              {location.division} · {location.country}
            </small>
          </strong>
        </div>
        <button
          type="button"
          onClick={() => {
            setExpanded(true)
            setState('idle')
            setMessage('')
            setManual(false)
          }}
        >
          Change <Icon name="arrow" size={16} />
        </button>
      </section>
    )

  const success = state === 'success' && !manual
  const label = restoring
    ? 'Loading your saved location…'
    : saving
      ? 'Saving your location…'
      : manual
        ? 'Choose your location'
        : state === 'idle'
          ? title
          : headings[state]
  return (
    <section
      className={`location-scene location-bg-${backgroundStyle}`}
      data-motion={animationIntensity}
      style={
        {
          '--location-accent': accentColor,
          '--location-radius': `${borderRadius}px`,
        } as CSSProperties
      }
      aria-labelledby={`${id}-heading`}
    >
      <div className="location-context">
        <span className="location-context-mark">
          <Icon name="globe" size={17} />
        </span>{' '}
        EARTH DATA. LOCAL PERSPECTIVE.
      </div>
      <p className="sr-only" role="status" aria-live="polite">{label}</p>
      <div className="location-card" data-state={state} aria-busy={busy}>
        <div
          className={`location-orb ${busy ? 'is-scanning' : ''} ${success ? 'is-success' : ''}`}
          aria-hidden="true"
        >
          <span className="location-ring" />
          <span className="location-ring second" />
          <Icon name={isError ? 'pinOff' : success ? 'check' : manual ? 'map' : 'pin'} size={34} />
        </div>
        <p className="location-eyebrow">
          {success
            ? 'CONNECTED TO YOUR REGION'
            : manual
              ? 'A LOCAL START'
              : 'YOUR NEXT SEASON STARTS HERE'}
        </p>
        <div className="location-copy" key={manual ? 'manual' : state}>
          <h2
            id={`${id}-heading`}
            ref={heading}
            tabIndex={-1}
            className={success ? 'location-success-heading' : ''}
          >
            {success ? (
              <>
                You’re in<strong>{location?.district}</strong>
              </>
            ) : (
              label
            )}
          </h2>
          {success ? (
            <>
              <p className="location-region">
                {[location?.division, location?.country].filter(Boolean).join(', ')}
              </p>
              <p>Your local agricultural insights are ready.</p>
              {signedIn && (
                <span className="location-saved">
                  <Icon name="check" size={14} /> Saved to your account
                </span>
              )}
            </>
          ) : (
            <p>
              {restoring
                ? 'Picking up where you left off.'
                : manual
                  ? 'Select your division, then your district. No location permission needed.'
                  : state === 'requesting-permission'
                    ? 'Allow location in your browser’s permission prompt to continue.'
                    : state === 'detecting'
                      ? 'Your device is finding its coordinates. This may take a moment.'
                      : state === 'reverse-geocoding'
                        ? 'Matching your coordinates with your local region.'
                        : state === 'permission-denied'
                          ? 'Please allow location access in your browser, or choose your location manually.'
                          : isError
                            ? 'You can try again or choose your location manually.'
                            : description}
            </p>
          )}
        </div>
        {message && (
          <p className="location-notice" role={isError ? 'alert' : 'status'}>
            {message}
          </p>
        )}
        {manual ? (
          <form
            className="location-manual"
            onSubmit={(event) => {
              event.preventDefault()
              void chooseDistrict()
            }}
          >
            <label htmlFor={`${id}-division`}>
              Division
              <select
                id={`${id}-division`}
                value={divisionId}
                required
                disabled={busy || !divisions.length}
                onChange={(event) => {
                  setDivisionId(event.target.value)
                  setDistrictId('')
                }}
              >
                <option value="" disabled>
                  Select division
                </option>
                {divisions.map((item) => (
                  <option key={item.division_id} value={item.division_id}>
                    {item.division_name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={`${id}-district`}>
              District
              <select
                id={`${id}-district`}
                value={districtId}
                required
                disabled={busy || !divisionId}
                onChange={(event) => setDistrictId(event.target.value)}
              >
                <option value="" disabled>
                  Select district
                </option>
                {districts
                  .filter((item) => String(item.division_id) === divisionId)
                  .map((item) => (
                    <option key={item.district_id} value={item.district_id}>
                      {item.district_name}
                    </option>
                  ))}
              </select>
            </label>
            {!divisions.length && (
              <p className="location-notice">
                District data is not available yet. Please retry loading the page.
              </p>
            )}
            <button className="location-primary" disabled={!districtId || busy}>
              {saving ? 'Saving…' : 'Use this district'}
              <Icon name="arrow" size={17} />
            </button>
            <button
              type="button"
              className="location-secondary"
              disabled={busy}
              onClick={() => {
                setManual(false)
                setState('idle')
                setMessage('')
              }}
            >
              Back to location detection
            </button>
          </form>
        ) : (
          <div className="location-actions">
            <button
              type="button"
              className="location-primary"
              disabled={busy}
              onClick={success ? proceed : () => void detect()}
            >
              {busy ? (
                <>
                  <span className="location-spinner" />
                  {restoring ? 'Loading your location…' : 'Finding your location…'}
                </>
              ) : success ? (
                <>
                  Continue
                  <Icon name="arrow" size={18} />
                </>
              ) : isError ? (
                <>
                  Try again
                  <Icon name="refresh" size={18} />
                </>
              ) : (
                <>
                  <Icon name="navigation" size={18} />
                  {buttonText}
                </>
              )}
            </button>
            <button
              type="button"
              className="location-secondary"
              disabled={busy}
              onClick={() => {
                setManual(true)
                setState('idle')
                setMessage('')
              }}
            >
              <Icon name="map" size={17} />
              {isError
                ? 'Choose manually'
                : success
                  ? 'Choose a different location'
                  : 'Choose location manually'}
            </button>
            {location?.districtId && !success && (
              <button
                type="button"
                className="location-secondary"
                disabled={busy}
                onClick={proceed}
              >
                Keep {location.district}
              </button>
            )}
          </div>
        )}
        <div className="location-privacy">
          <Icon name="shield" size={16} />
          <span>Your location is only used to personalize your experience.</span>
        </div>
        <details className="location-disclosure">
          <summary>How your location is used</summary>
          <p>
            Your browser controls location permission. With your consent, coordinates go through our
            server to OpenStreetMap Nominatim.{' '}
            {signedIn
              ? 'We save your location to your account so you don’t need to detect it again.'
              : 'Sign in to save a location for future visits.'}{' '}
            Check your district near boundaries. This does not change farm coordinates.
          </p>
        </details>
        <a className="location-attribution" href="https://www.openstreetmap.org/copyright">Location data © OpenStreetMap contributors</a>
      </div>
      <p className="location-scene-note">
        <Icon name="leaf" size={15} /> A wider view of Earth. A closer look at your land.
      </p>
    </section>
  )
}
