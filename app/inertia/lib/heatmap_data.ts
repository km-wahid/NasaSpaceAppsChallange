export type DayStressCategory =
  'optimal_moisture' | 'plentiful_rain' | 'mild_dry' | 'high_heat' | 'extreme_drought'

export interface DailyClimatePoint {
  day: number
  dateStr: string
  dayOfWeek: string
  tempMaxC: number
  tempMinC: number
  rainfallMm: number
  soilMoisturePct: number
  evapotranspirationMm: number
  category: DayStressCategory
  categoryLabel: string
  nasaPowerSolarKwh: number
  gpmRainCategory: string
  ecostressMoistureStatus: string
  farmingAdvice: string
}

export interface MonthHeatmapData {
  monthIndex: number
  monthName: string
  seasonName: string
  avgTempC: number
  totalRainMm: number
  avgSoilMoisturePct: number
  heatwaveDays: number
  rainyDays: number
  optimalDays: number
  days: DailyClimatePoint[]
}

export interface HistoricalYearCompare {
  year: number
  avgTemp: number
  totalMonsoonRainMm: number
  winterDurationDays: number
  soilHealthIndex: number // 0-100
  notes: string
}

export interface CropCycleHistoryItem {
  year: number
  season: string
  cropName: string
  cropFamily: string
  color: string
  waterUsedMm: number
  soilHealthImpact: string
  nitrogenContribution: string
  status: 'Completed' | 'Current' | 'Planned'
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const seasons = [
  'Rabi (Winter)',
  'Rabi (Late Winter)',
  'Kharif-1 (Pre-Monsoon)',
  'Kharif-1 (Summer)',
  'Kharif-1 / Kharif-2',
  'Kharif-2 (Monsoon)',
  'Kharif-2 (Peak Monsoon)',
  'Kharif-2 (Monsoon)',
  'Kharif-2 (Late Monsoon)',
  'Kharif-2 / Rabi',
  'Rabi (Early Winter)',
  'Rabi (Winter)',
]

export function generateDailyHeatmapData(
  monthIdx: number,
  year: number = new Date().getFullYear()
): MonthHeatmapData {
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  const days: DailyClimatePoint[] = []

  let totalRain = 0
  let totalTemp = 0
  let totalMoisture = 0
  let heatwaveDays = 0
  let rainyDays = 0
  let optimalDays = 0

  // Month base climatology profiles
  // 0=Jan, 1=Feb, 2=Mar, 3=Apr, 4=May, 5=Jun, 6=Jul, 7=Aug, 8=Sep, 9=Oct, 10=Nov, 11=Dec
  const baseTemps = [25, 29, 34, 37, 36, 34, 33, 33, 33, 32, 29, 26]
  const baseRains = [8, 18, 45, 120, 220, 360, 410, 340, 260, 140, 25, 10]
  const baseMoistures = [48, 42, 35, 30, 45, 68, 85, 82, 75, 60, 52, 49]

  const monthBaseTemp = baseTemps[monthIdx]
  const monthExpectedRain = baseRains[monthIdx]
  const monthBaseMoisture = baseMoistures[monthIdx]

  for (let d = 1; d <= daysInMonth; d++) {
    // Deterministic pseudo-random variation based on day & month
    const seed = Math.sin(monthIdx * 31 + d * 7) * 10000
    const rand = seed - Math.floor(seed)

    const tempMax = Math.round((monthBaseTemp + (rand * 6 - 3)) * 10) / 10
    const tempMin = Math.round((tempMax - (9 + (rand * 4 - 2))) * 10) / 10

    let rain = 0
    // Rain probabilities higher in June-Sept
    if (monthIdx >= 4 && monthIdx <= 8) {
      if (rand > 0.45) {
        rain = Math.round((rand * (monthExpectedRain / 12) + 2) * 10) / 10
      }
    } else if (monthIdx === 2 || monthIdx === 3) {
      // Pre-monsoon Kalbaishakhi thunderstorms
      if (rand > 0.75) {
        rain = Math.round((rand * 25 + 5) * 10) / 10
      }
    } else {
      if (rand > 0.88) {
        rain = Math.round(rand * 10 * 10) / 10
      }
    }

    const moisture = Math.min(
      95,
      Math.max(18, Math.round(monthBaseMoisture + (rain > 5 ? 15 : -d * 0.4) + (rand * 8 - 4)))
    )
    const et = Math.round((tempMax * 0.12 + (tempMax > 35 ? 1.5 : 0.5)) * 10) / 10
    const solarRad = Math.round((4.2 + rand * 2.2) * 10) / 10

    totalRain += rain
    totalTemp += tempMax
    totalMoisture += moisture

    // Determine color-coded stress category
    let category: DayStressCategory = 'optimal_moisture'
    let categoryLabel = 'Optimal Soil Moisture'
    let gpmRainCategory = 'No Rain / Light Dew'
    let ecostressStatus = 'Balanced Root-zone Moisture'
    let farmingAdvice = 'Favorable condition for active cultivation and fieldwork.'

    if (rain >= 25) {
      category = 'plentiful_rain'
      categoryLabel = 'Heavy Rain / Surplus Moisture'
      gpmRainCategory = `GPM IMERG: Heavy (${rain} mm)`
      ecostressStatus = 'Saturated Topsoil'
      farmingAdvice = 'Ensure field drainage channels are open to prevent standing water.'
      rainyDays++
    } else if (rain > 5) {
      category = 'optimal_moisture'
      categoryLabel = 'Beneficial Rain & Moisture'
      gpmRainCategory = `GPM IMERG: Moderate (${rain} mm)`
      ecostressStatus = 'Optimal Field Capacity'
      farmingAdvice = 'Natural rainfall provides adequate moisture; hold off extra irrigation.'
      rainyDays++
      optimalDays++
    } else if (tempMax >= 37.5) {
      category = 'extreme_drought'
      categoryLabel = 'Severe Heat & Moisture Deficit'
      gpmRainCategory = 'GPM IMERG: Zero Rain'
      ecostressStatus = 'Severe Evaporative Stress'
      farmingAdvice =
        'Apply straw mulching immediately and provide evening light supplemental irrigation.'
      heatwaveDays++
    } else if (tempMax >= 34.5 || moisture < 30) {
      category = 'high_heat'
      categoryLabel = 'Elevated Heat / Dry Soil'
      gpmRainCategory = 'GPM IMERG: Dry Spell'
      ecostressStatus = 'Dry Surface Crust'
      farmingAdvice = 'Monitor seedling wilting; check shallow irrigation access.'
      heatwaveDays++
    } else if (moisture < 42) {
      category = 'mild_dry'
      categoryLabel = 'Moderate Dry Spell'
      gpmRainCategory = 'GPM IMERG: Scanty Dew'
      ecostressStatus = 'Low Topsoil Moisture'
      farmingAdvice = 'Suitable for weeding and land preparation; irrigate if sowing.'
    } else {
      optimalDays++
    }

    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
      new Date(year, monthIdx, d).getDay()
    ]

    days.push({
      day: d,
      dateStr: `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dayOfWeek,
      tempMaxC: tempMax,
      tempMinC: tempMin,
      rainfallMm: rain,
      soilMoisturePct: moisture,
      evapotranspirationMm: et,
      category,
      categoryLabel,
      nasaPowerSolarKwh: solarRad,
      gpmRainCategory,
      ecostressMoistureStatus: ecostressStatus,
      farmingAdvice,
    })
  }

  return {
    monthIndex: monthIdx,
    monthName: monthNames[monthIdx],
    seasonName: seasons[monthIdx],
    avgTempC: Math.round((totalTemp / daysInMonth) * 10) / 10,
    totalRainMm: Math.round(totalRain * 10) / 10,
    avgSoilMoisturePct: Math.round(totalMoisture / daysInMonth),
    heatwaveDays,
    rainyDays,
    optimalDays,
    days,
  }
}

export const multiYearComparisonData: HistoricalYearCompare[] = [
  {
    year: 2021,
    avgTemp: 26.2,
    totalMonsoonRainMm: 1480,
    winterDurationDays: 110,
    soilHealthIndex: 78,
    notes: 'Evenly distributed monsoon, longer winter window, normal crop yields.',
  },
  {
    year: 2023,
    avgTemp: 27.1,
    totalMonsoonRainMm: 1290,
    winterDurationDays: 98,
    soilHealthIndex: 72,
    notes: 'Delayed monsoon onset by 14 days, erratic flash rain in August.',
  },
  {
    year: 2025,
    avgTemp: 27.8,
    totalMonsoonRainMm: 1190,
    winterDurationDays: 88,
    soilHealthIndex: 69,
    notes: 'Record April heatwaves (>40°C), shorter winter, high irrigation pressure.',
  },
  {
    year: 2026,
    avgTemp: 27.6,
    totalMonsoonRainMm: 1240,
    winterDurationDays: 92,
    soilHealthIndex: 84,
    notes: 'Targeting legume rejuvenation and rainfall-matched crop rotation.',
  },
]

export const cropCycleTimelineData: CropCycleHistoryItem[] = [
  {
    year: 2024,
    season: 'Rabi (Winter)',
    cropName: 'Boro Rice',
    cropFamily: 'Cereal (High Water)',
    color: '#3b82f6',
    waterUsedMm: 1250,
    soilHealthImpact: 'Heavy synthetic fertilizer use; high groundwater extraction.',
    nitrogenContribution: '0 kg/ha (Depleted topsoil nitrogen)',
    status: 'Completed',
  },
  {
    year: 2024,
    season: 'Kharif-2 (Monsoon)',
    cropName: 'Aman Rice',
    cropFamily: 'Cereal',
    color: '#0ea5e9',
    waterUsedMm: 980,
    soilHealthImpact: 'Good rainfed yield; soil compacted by puddling.',
    nitrogenContribution: '0 kg/ha',
    status: 'Completed',
  },
  {
    year: 2025,
    season: 'Rabi (Winter)',
    cropName: 'Mustard',
    cropFamily: 'Oilseed',
    color: '#eab308',
    waterUsedMm: 310,
    soilHealthImpact: 'Reduced irrigation cost; broke rice stem borer pest cycle.',
    nitrogenContribution: '0 kg/ha',
    status: 'Completed',
  },
  {
    year: 2025,
    season: 'Kharif-1 (Summer)',
    cropName: 'Mungbean (Legume)',
    cropFamily: 'Legume (Nitrogen Fixer)',
    color: '#10b981',
    waterUsedMm: 270,
    soilHealthImpact: 'Significantly restored soil organic matter and beneficial microbes.',
    nitrogenContribution: '+42 kg/ha fixed biologically',
    status: 'Completed',
  },
  {
    year: 2025,
    season: 'Kharif-2 (Monsoon)',
    cropName: 'Short-Duration Aman',
    cropFamily: 'Cereal',
    color: '#06b6d4',
    waterUsedMm: 850,
    soilHealthImpact: 'Harvested early in October, allowing prompt winter sowing.',
    nitrogenContribution: '+10 kg/ha residue recycling',
    status: 'Completed',
  },
  {
    year: 2026,
    season: 'Rabi (Current Planned)',
    cropName: 'Lentil + Mustard Intercrop',
    cropFamily: 'Legume & Oilseed',
    color: '#059669',
    waterUsedMm: 280,
    soilHealthImpact: 'Multi-season planned rotation: balances water and natural fertility.',
    nitrogenContribution: '+38 kg/ha natural nitrogen boost',
    status: 'Current',
  },
]
