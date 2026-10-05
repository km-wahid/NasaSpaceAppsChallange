import { useEffect, useState } from 'react'
import type { Catalog } from './data_browser'
import { api } from '../lib/api'
import { Link } from '@adonisjs/inertia/react'
import Icon from './icon'

type Farm = {
  farm_id: string
  name: string
  district_id: string
  area_hectares?: string | null
  latitude?: string | null
  longitude?: string | null
  irrigation_available_mm_per_season?: string | null
}
type Inputs = {
  soil: { ph: string; sampled_at: string } | null
  measurements: Array<{ nutrient: string; threshold_set_id: string; raw_value: string }>
  history: Array<{
    crop_id: string | null
    season_id: string
    crop_year: number
    land_use_type: string
    harvest_date: string | null
  }>
  preferences: Record<string, number> | null
}
const labels = ['climate', 'water', 'soil', 'resilience', 'economic'] as const
const currentYear = new Date().getFullYear()
const defaultHistory = [0, 1].map((index) => ({
  cropId: '',
  seasonId: String(index + 1),
  cropYear: currentYear,
  landUseType: 'unknown',
  harvestDate: '',
}))

export default function FarmWorkspace({ catalog }: { catalog: Catalog }) {
  const [farms, setFarms] = useState<Farm[]>([])
  const [farmId, setFarmId] = useState('')
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [irrigation, setIrrigation] = useState('')
  const [turnaround, setTurnaround] = useState(10)
  const [weights, setWeights] = useState([15, 20, 25, 10, 30])
  const [history, setHistory] = useState(defaultHistory)
  const [ph, setPh] = useState('')
  const [sampledAt, setSampledAt] = useState(new Date().toISOString().slice(0, 10))
  const [nutrients, setNutrients] = useState(
    ['nitrogen', 'phosphorus', 'potassium'].map((nutrient) => ({
      nutrient,
      thresholdSetId: '',
      value: '',
    }))
  )
  const [environment, setEnvironment] = useState<Record<string, unknown> | null>(null)
  const [busy, setBusy] = useState('')
  const [step, setStep] = useState(0)
  const [inputsLoading, setInputsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const totalWeight = weights.reduce((sum, value) => sum + value, 0)
  useEffect(() => {
    const selected = farms.find((farm) => String(farm.farm_id) === farmId)
    if (!selected) return
    setArea(selected.area_hectares ?? '')
    setLatitude(selected.latitude ?? '')
    setLongitude(selected.longitude ?? '')
    setIrrigation(selected.irrigation_available_mm_per_season ?? '')
  }, [farmId, farms])
  useEffect(() => {
    api<Farm[]>('/api/v1/farms')
      .then((rows) => {
        setFarms(rows)
        if (rows.length) setFarmId(String(rows[0].farm_id))
      })
      .catch((reason) => setError(reason.message))
  }, [])
  useEffect(() => {
    setLatitude('')
    setLongitude('')
  }, [catalog.district.district_id])
  useEffect(() => {
    setEnvironment(null)
    setMessage('')
    setError('')
    setHistory(defaultHistory)
    setWeights([15, 20, 25, 10, 30])
    setPh('')
    if (!farmId) {
      setInputsLoading(false)
      return
    }
    setInputsLoading(true)
    const controller = new AbortController()
    api<Inputs>(`/api/v1/farms/${farmId}/inputs`, 'GET', undefined, controller.signal)
      .then((data) => {
        if (data.preferences)
          setWeights(labels.map((label) => data.preferences![`${label}_weight_bp`] / 100))
        if (data.history.length)
          setHistory(
            data.history.map((row) => ({
              cropId: row.crop_id ? String(row.crop_id) : '',
              seasonId: String(row.season_id),
              cropYear: row.crop_year,
              landUseType: row.land_use_type,
              harvestDate: row.harvest_date?.slice(0, 10) ?? '',
            }))
          )
        if (data.soil) {
          setPh(data.soil.ph)
          setSampledAt(data.soil.sampled_at.slice(0, 10))
        }
        setNutrients(
          ['nitrogen', 'phosphorus', 'potassium'].map((nutrient) => {
            const measurement = data.measurements.find((row) => row.nutrient === nutrient)
            return {
              nutrient,
              thresholdSetId: measurement ? String(measurement.threshold_set_id) : '',
              value: measurement?.raw_value ?? '',
            }
          })
        )
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setInputsLoading(false)
      })
    api<Record<string, unknown>>(
      `/api/v1/farms/${farmId}/environment`,
      'GET',
      undefined,
      controller.signal
    )
      .then(setEnvironment)
      .catch((reason) => {
        if (!controller.signal.aborted && reason.message !== 'ENVIRONMENT_PROFILE_MISSING')
          setError(reason.message)
      })
    return () => controller.abort()
  }, [farmId])
  async function act(label: string, operation: () => Promise<void>) {
    setBusy(label)
    setMessage('')
    setError('')
    try {
      await operation()
      setMessage(`${label} completed.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message.replaceAll('_', ' ') : 'Request failed.')
    } finally {
      setBusy('')
    }
  }
  const base = `/api/v1/farms/${farmId}`
  const priorityFields = (
    <>
      <div className="data-toolbar">
        <button type="button" onClick={() => setWeights([15, 10, 10, 15, 50])}>
          Income focus
        </button>
        <button type="button" onClick={() => setWeights([15, 30, 35, 10, 10])}>
          Soil and water focus
        </button>
      </div>
      <div className="data-form">
        {labels.map((label, index) => (
          <label key={label}>
            {
              {
                climate: 'Climate suitability',
                water: 'Water conservation',
                soil: 'Soil health',
                resilience: 'Weather resilience',
                economic: 'Income potential',
              }[label]
            }{' '}
            (%)
            <input
              type="number"
              required
              min="0"
              max="100"
              step="1"
              value={weights[index]}
              onChange={(event) =>
                setWeights(
                  weights.map((weight, i) => (i === index ? Number(event.target.value) : weight))
                )
              }
            />
          </label>
        ))}
      </div>
      <p>Total: {totalWeight}% — must equal 100%.</p>
    </>
  )
  return (
    <section className="card farm-workspace" id="farm-workspace">
      <div className="farm-workspace-heading">
        <span className="agri-icon-box">
          <Icon name="layers" size={24} />
        </span>
        <p className="agri-eyebrow text-primary">FROM INSIGHT TO ACTION</p>
        <h2>Your farm workspace</h2>
      </div>
      <p>
        Only your priorities are required. We already have your district. Add extra details only if
        you want more tailored checks.
      </p>
      <label>
        Saved farm
        <select
          aria-label="Saved farm"
          disabled={!!busy}
          value={farmId}
          onChange={(event) => setFarmId(event.target.value)}
        >
          <option value="">Select a farm</option>
          {farms.map((farm) => (
            <option value={farm.farm_id} key={farm.farm_id}>
              {farm.name} —{' '}
              {
                catalog.districts.find(
                  (district) => String(district.district_id) === String(farm.district_id)
                )?.district_name
              }
            </option>
          ))}
        </select>
      </label>
      <details className="farm-create-panel" open={!farms.length}>
        <summary>Create a farm in {catalog.district.district_name}</summary>
        <form
          className="data-form"
          onSubmit={(event) => {
            event.preventDefault()
            void act('Create farm', async () => {
              if (Boolean(latitude) !== Boolean(longitude))
                throw new Error('Provide both coordinates or leave both blank.')
              const farm = await api<Farm>('/api/v1/farms', 'POST', {
                districtId: Number(catalog.district.district_id),
                ...(name.trim() ? { name } : {}),
                ...(area ? { areaHectares: Number(area) } : {}),
                ...(latitude && longitude
                  ? { latitude: Number(latitude), longitude: Number(longitude) }
                  : {}),
                ...(irrigation ? { irrigationAvailableMmPerSeason: Number(irrigation) } : {}),
                minimumTurnaroundDays: turnaround,
                priorities: Object.fromEntries(
                  labels.map((label, index) => [`${label}Weight`, weights[index]])
                ),
              })
              setFarms([...farms, farm])
              setFarmId(String(farm.farm_id))
              setName('')
            })
          }}
        >
          <h3>What matters most to you?</h3>
          {priorityFields}
          <details className="collapse collapse-arrow border border-base-300 bg-base-100 col-span-full">
            <summary className="collapse-title font-semibold">Add extra details (optional)</summary>
            <div className="collapse-content data-form">
              <label>
                Farm name (optional)
                <input
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label>
                Area (hectares)
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                />
              </label>
              <label>
                Latitude
                <input
                  type="number"
                  min="-90"
                  max="90"
                  step="any"
                  value={latitude}
                  onChange={(event) => setLatitude(event.target.value)}
                />
              </label>
              <label>
                Longitude
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="any"
                  value={longitude}
                  onChange={(event) => setLongitude(event.target.value)}
                />
              </label>
              <label>
                Irrigation per season (mm)
                <input
                  type="number"
                  min="0"
                  value={irrigation}
                  onChange={(event) => setIrrigation(event.target.value)}
                />
              </label>
              <label>
                Land preparation (days)
                <input
                  type="number"
                  min="0"
                  max="45"
                  value={turnaround}
                  onChange={(event) => setTurnaround(Number(event.target.value))}
                />
              </label>
              <p>
                Leave unknown measurements blank. The planning calendar allows 10 days for land
                preparation unless you change it.
              </p>
            </div>
          </details>
          <button disabled={!!busy || totalWeight !== 100}>Save priorities and create farm</button>
        </form>
      </details>
      {farmId && (
        <div>
          <form
            className="card border border-primary/20 bg-base-100 p-5 my-5"
            onSubmit={(event) => {
              event.preventDefault()
              void act('Save preferences', async () => {
                await api(
                  `${base}/preferences`,
                  'PUT',
                  Object.fromEntries(
                    labels.map((label, index) => [`${label}Weight`, weights[index]])
                  )
                )
              })
            }}
          >
            <h3 className="text-xl font-semibold">Your priorities</h3>
            <p className="my-3 text-sm">
              This is all you need to provide. Soil tests, previous crops and environmental refresh
              are optional.
            </p>
            {priorityFields}
            <button disabled={!!busy || inputsLoading || totalWeight !== 100}>
              Save priorities
            </button>
          </form>
          <Link href="/planner" className="btn btn-primary mb-5">
            See crop rotations
            <Icon name="arrow" />
          </Link>
          <details className="collapse collapse-arrow border border-base-300 bg-base-100">
            <summary className="collapse-title font-semibold">Add extra details (optional)</summary>
            <div className="collapse-content">
              <nav className="workspace-steps" aria-label="Farm setup steps">
                {['Environment', 'Crop history', 'Soil inputs', 'Priorities', 'Rotations'].map(
                  (title, index) => (
                    <button
                      key={title}
                      type="button"
                      aria-pressed={step === index}
                      disabled={!!busy}
                      onClick={() => setStep(index)}
                    >
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      {title}
                    </button>
                  )
                )}
              </nav>
              <fieldset
                disabled={!!busy || inputsLoading}
                className="workspace-controls"
                data-step={step}
              >
                <legend className="sr-only">
                  Inputs and recommendations for your selected farm
                </legend>
                <section>
                  <h3>1. Environmental observations</h3>
                  <p className="mb-3">Optional measurements — leave anything unknown blank.</p>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      void act('Save optional details', async () => {
                        const updated = await api<Farm>(`${base}/details`, 'PUT', {
                          areaHectares: area === '' ? null : Number(area),
                          latitude: latitude === '' ? null : Number(latitude),
                          longitude: longitude === '' ? null : Number(longitude),
                          irrigationAvailableMmPerSeason:
                            irrigation === '' ? null : Number(irrigation),
                        })
                        setFarms(
                          farms.map((farm) => (String(farm.farm_id) === farmId ? updated : farm))
                        )
                      })
                    }}
                  >
                    <div className="data-form">
                      <label>
                        Farm size (hectares)
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          value={area}
                          onChange={(event) => setArea(event.target.value)}
                        />
                      </label>
                      <label>
                        Latitude
                        <input
                          type="number"
                          min="-90"
                          max="90"
                          step="any"
                          value={latitude}
                          onChange={(event) => setLatitude(event.target.value)}
                        />
                      </label>
                      <label>
                        Longitude
                        <input
                          type="number"
                          min="-180"
                          max="180"
                          step="any"
                          value={longitude}
                          onChange={(event) => setLongitude(event.target.value)}
                        />
                      </label>
                      <label>
                        Irrigation per season (mm)
                        <input
                          type="number"
                          min="0"
                          max="100000"
                          step="any"
                          value={irrigation}
                          onChange={(event) => setIrrigation(event.target.value)}
                        />
                      </label>
                    </div>
                    <button>Save optional details</button>
                  </form>
                  <p>
                    {environment
                      ? `Cached profile available. Last calculated: ${new Date(String(environment.calculated_at)).toLocaleString()}`
                      : 'No cached NASA profile available for this farm.'}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void act('NASA refresh', async () =>
                        setEnvironment(
                          await api<Record<string, unknown>>(`${base}/environment/refresh`, 'POST')
                        )
                      )
                    }
                  >
                    Refresh NASA observations
                  </button>
                </section>
                <section>
                  <h3>2. Previous crops</h3>
                  <p>
                    Add two actual previous seasons to check crop breaks. Without them, plans are
                    season-based guidance and prior-crop checks are marked incomplete.
                  </p>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      void act('Save crop history', async () => {
                        await api(`${base}/history`, 'PUT', {
                          entries: history.map((row) => ({
                            ...row,
                            seasonId: Number(row.seasonId),
                            cropId: row.landUseType === 'crop' ? Number(row.cropId) : null,
                            harvestDate: row.harvestDate || null,
                          })),
                        })
                      })
                    }}
                  >
                    {history.map((row, index) => (
                      <div className="data-form" key={index}>
                        <label>
                          Year
                          <input
                            required
                            type="number"
                            min="1900"
                            max={currentYear}
                            value={row.cropYear}
                            onChange={(event) =>
                              setHistory(
                                history.map((item, i) =>
                                  i === index
                                    ? { ...item, cropYear: Number(event.target.value) }
                                    : item
                                )
                              )
                            }
                          />
                        </label>
                        <label>
                          Season
                          <select
                            aria-label="History season"
                            value={row.seasonId}
                            onChange={(event) =>
                              setHistory(
                                history.map((item, i) =>
                                  i === index ? { ...item, seasonId: event.target.value } : item
                                )
                              )
                            }
                          >
                            {catalog.seasons.map((season) => (
                              <option value={season.season_id} key={season.season_id}>
                                {season.season_name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Land use
                          <select
                            aria-label="Land use"
                            value={row.landUseType}
                            onChange={(event) =>
                              setHistory(
                                history.map((item, i) =>
                                  i === index ? { ...item, landUseType: event.target.value } : item
                                )
                              )
                            }
                          >
                            <option value="unknown">Unknown</option>
                            <option value="crop">Crop</option>
                            <option value="fallow">Fallow</option>
                          </select>
                        </label>
                        {row.landUseType === 'crop' && (
                          <>
                            <label>
                              Crop
                              <select
                                aria-label="Previous crop"
                                required
                                value={row.cropId}
                                onChange={(event) =>
                                  setHistory(
                                    history.map((item, i) =>
                                      i === index ? { ...item, cropId: event.target.value } : item
                                    )
                                  )
                                }
                              >
                                <option value="">Select crop</option>
                                {catalog.crops.map((crop) => (
                                  <option key={crop.crop_id} value={crop.crop_id}>
                                    {crop.crop_name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Harvest date
                              <input
                                required
                                type="date"
                                value={row.harvestDate}
                                onChange={(event) =>
                                  setHistory(
                                    history.map((item, i) =>
                                      i === index
                                        ? { ...item, harvestDate: event.target.value }
                                        : item
                                    )
                                  )
                                }
                              />
                            </label>
                          </>
                        )}
                      </div>
                    ))}
                    <button>Save crop history</button>
                  </form>
                </section>
                <section>
                  <h3>3. Soil measurements</h3>
                  {nutrients.some(
                    (item) =>
                      !catalog.thresholds.some((threshold) => threshold.nutrient === item.nutrient)
                  ) ? (
                    <p className="data-warning">
                      Reviewed nutrient thresholds are missing. Soil measurements cannot yet be
                      normalized. No district or example values are being saved as a lab test.
                    </p>
                  ) : (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault()
                        void act('Save soil profile', async () => {
                          await api(`${base}/soil`, 'PUT', {
                            sampledAt,
                            ph: Number(ph),
                            sourceType: 'laboratory',
                            nutrients: nutrients.map((item) => {
                              const threshold = catalog.thresholds.find(
                                (row) =>
                                  String(row.threshold_set_id) === item.thresholdSetId &&
                                  row.nutrient === item.nutrient
                              )!
                              return {
                                nutrient: item.nutrient,
                                value: Number(item.value),
                                thresholdSetId: Number(item.thresholdSetId),
                                unit: threshold.unit,
                                analyticalMethod: threshold.analytical_method,
                              }
                            }),
                          })
                        })
                      }}
                    >
                      <label>
                        Sample date
                        <input
                          type="date"
                          required
                          value={sampledAt}
                          onChange={(event) => setSampledAt(event.target.value)}
                        />
                      </label>
                      <label>
                        pH
                        <input
                          type="number"
                          required
                          min="0"
                          max="14"
                          step="0.01"
                          value={ph}
                          onChange={(event) => setPh(event.target.value)}
                        />
                      </label>
                      {nutrients.map((item, index) => (
                        <div className="data-form" key={item.nutrient}>
                          <label>
                            {item.nutrient} method and unit
                            <select
                              aria-label={`${item.nutrient} method and unit`}
                              required
                              value={item.thresholdSetId}
                              onChange={(event) =>
                                setNutrients(
                                  nutrients.map((row, i) =>
                                    i === index
                                      ? { ...row, thresholdSetId: event.target.value }
                                      : row
                                  )
                                )
                              }
                            >
                              <option value="">Match your laboratory method</option>
                              {catalog.thresholds
                                .filter((row) => row.nutrient === item.nutrient)
                                .map((row) => (
                                  <option key={row.threshold_set_id} value={row.threshold_set_id}>
                                    {row.name} — {row.analytical_method} ({row.unit})
                                  </option>
                                ))}
                            </select>
                          </label>
                          <label>
                            Measured value
                            <input
                              type="number"
                              required
                              min="0"
                              step="any"
                              value={item.value}
                              onChange={(event) =>
                                setNutrients(
                                  nutrients.map((row, i) =>
                                    i === index ? { ...row, value: event.target.value } : row
                                  )
                                )
                              }
                            />
                          </label>
                        </div>
                      ))}
                      <button>Save soil profile</button>
                    </form>
                  )}
                </section>
                <section>
                  <h3>4. Farmer priorities</h3>
                  <div className="data-toolbar">
                    <button type="button" onClick={() => setWeights([15, 10, 10, 15, 50])}>
                      Profit focus
                    </button>
                    <button type="button" onClick={() => setWeights([15, 30, 35, 10, 10])}>
                      Soil and water focus
                    </button>
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      void act('Save preferences', async () => {
                        await api(
                          `${base}/preferences`,
                          'PUT',
                          Object.fromEntries(
                            labels.map((label, index) => [`${label}Weight`, weights[index]])
                          )
                        )
                      })
                    }}
                  >
                    <div className="data-form">
                      {labels.map((label, index) => (
                        <label key={label}>
                          {label} (%)
                          <input
                            type="number"
                            required
                            min="0"
                            max="100"
                            step="1"
                            value={weights[index]}
                            onChange={(event) =>
                              setWeights(
                                weights.map((weight, i) =>
                                  i === index ? Number(event.target.value) : weight
                                )
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <p>Total: {totalWeight}% — must equal 100%.</p>
                    <button disabled={totalWeight !== 100}>Save priorities</button>
                  </form>
                </section>
                <section>
                  <h3>Ready to explore?</h3>
                  <p>
                    After saving these details, choose this farm in the crop planner and build your
                    outlook.
                  </p>
                  <Link href="/planner" className="btn btn-neutral rounded-full justify-self-start">
                    Open crop planner <Icon name="arrow" size={18} />
                  </Link>
                </section>
              </fieldset>
            </div>
          </details>
        </div>
      )}
      {busy && <p role="status">{busy} in progress…</p>}
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="data-warning">
          {error}
        </p>
      )}
    </section>
  )
}
