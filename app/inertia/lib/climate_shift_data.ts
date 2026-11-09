export type SeasonShiftMetric = {
  id: string
  title: string
  icon: 'sun' | 'water' | 'leaf' | 'history'
  thenValue: string
  nowValue: string
  delta: string
  deltaType: 'warning' | 'alert' | 'info'
  impactText: string
  farmerAction: string
}

export type SeasonalShiftDetail = {
  seasonKey: 'rabi' | 'kharif1' | 'kharif2'
  name: string
  period: string
  historicalProfile: {
    durationDays: number
    avgTemp: string
    rainfallPattern: string
    keyAdvantage: string
  }
  currentProfile: {
    durationDays: number
    avgTemp: string
    rainfallPattern: string
    mainChallenge: string
  }
  shiftSummary: string
  recommendedCropStrategy: string
}

export const generalShiftMetrics: SeasonShiftMetric[] = [
  {
    id: 'monsoon-timing',
    title: 'Monsoon Arrival & Shift',
    icon: 'water',
    thenValue: 'Early June (1st week)',
    nowValue: 'Late June / July (delayed by 2-3 weeks)',
    delta: '+15 to 20 days delay',
    deltaType: 'warning',
    impactText:
      'Delayed monsoon pushes back Aman rice transplanting, compressing the subsequent winter crop window.',
    farmerAction:
      'Opt for early-maturing Aman varieties (e.g., BRRI dhan-71/75) instead of long-duration varieties.',
  },
  {
    id: 'rabi-duration',
    title: 'Winter (Rabi) Window Length',
    icon: 'history',
    thenValue: '~115 - 125 cold days',
    nowValue: '~85 - 95 cold days (compressed)',
    delta: '-25 to 30 days shorter',
    deltaType: 'alert',
    impactText:
      'Warmer winter nights and premature February heat cause early flowering and shriveled grains in mustard and wheat.',
    farmerAction:
      'Plant short-duration mustard/lentils immediately after Aman harvest by early November.',
  },
  {
    id: 'rain-intensity',
    title: 'Rainfall Pattern & Flash Spells',
    icon: 'water',
    thenValue: 'Evenly distributed steady showers',
    nowValue: 'Erratic concentrated cloudbursts with dry gaps',
    delta: '+30% erratic intensity',
    deltaType: 'alert',
    impactText:
      'Sudden heavy downpours cause field waterlogging, while mid-season dry spells stress crops without irrigation.',
    farmerAction: 'Ensure good field drainage trenches and prepare backup supplemental irrigation.',
  },
  {
    id: 'temperature-rise',
    title: 'Pre-Monsoon Extreme Heat',
    icon: 'sun',
    thenValue: 'Average maximum 33°C - 35°C',
    nowValue: 'Spikes of 38°C - 41°C heatwaves in April',
    delta: '+1.3°C overall rise',
    deltaType: 'warning',
    impactText:
      'High evapotranspiration rapidly dries out topsoil moisture and wilts summer seedling roots.',
    farmerAction:
      'Use straw mulching and drought-tolerant legumes like Mungbean to preserve soil moisture.',
  },
]

export const seasonalShiftDetails: SeasonalShiftDetail[] = [
  {
    seasonKey: 'rabi',
    name: 'Rabi (Winter: Nov - Mar)',
    period: 'November to March',
    historicalProfile: {
      durationDays: 120,
      avgTemp: '16°C - 24°C',
      rainfallPattern: 'Scanty winter dew with steady cool spells',
      keyAdvantage: 'Long cool window ideal for mustard, wheat, lentil, and potato.',
    },
    currentProfile: {
      durationDays: 90,
      avgTemp: '18°C - 28°C (Warmer)',
      rainfallPattern: 'Dry spells with sudden late unseasonal rains',
      mainChallenge: 'Shortened chill hours; sudden early heat in February damages grain filling.',
    },
    shiftSummary:
      'Winter arrives 1-2 weeks late and departs early. The cool growing period is squeezed by almost a month.',
    recommendedCropStrategy:
      'Sow short-cycle mustard (e.g., BARI Sarisha-14) or lentils by Nov 15. Do not delay seeding.',
  },
  {
    seasonKey: 'kharif1',
    name: 'Kharif-1 (Pre-Monsoon: Mar - Jun)',
    period: 'March to June',
    historicalProfile: {
      durationDays: 90,
      avgTemp: '28°C - 33°C',
      rainfallPattern: 'Periodic Kalbaishakhi thunderstorms replenishing topsoil',
      keyAdvantage: 'Natural moisture allowed Aus rice and jute with minimal pumping.',
    },
    currentProfile: {
      durationDays: 90,
      avgTemp: '32°C - 39°C (Intense Heatwaves)',
      rainfallPattern: 'Prolonged dry heat with severe erratic localized storms',
      mainChallenge:
        'Severe soil moisture deficit; high irrigation costs and salinity rise in coastal belts.',
    },
    shiftSummary:
      'Pre-monsoon is hotter with unpredictable rainfall, making moisture management critical.',
    recommendedCropStrategy:
      'Plant fast-maturing Mungbean or short-duration Aus; use green manure to rebuild soil organic carbon.',
  },
  {
    seasonKey: 'kharif2',
    name: 'Kharif-2 (Monsoon: Jun - Oct)',
    period: 'June to October',
    historicalProfile: {
      durationDays: 120,
      avgTemp: '29°C - 32°C',
      rainfallPattern: 'Continuous steady monsoon rains filling all wetlands',
      keyAdvantage: 'Abundant rain supported rainfed Aman rice across the country.',
    },
    currentProfile: {
      durationDays: 110,
      avgTemp: '30°C - 34°C',
      rainfallPattern: 'Delayed onset; concentrated heavy downpours with mid-season gaps',
      mainChallenge: 'Late transplanting pushes harvest into winter, causing delayed Rabi sowing.',
    },
    shiftSummary:
      'The monsoon starts later and brings rain in intense bursts rather than steady showers.',
    recommendedCropStrategy:
      'Adopt 110-115 day Aman varieties (e.g., BRRI dhan-75) to harvest by late October for timely winter planting.',
  },
]
