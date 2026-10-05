/** Source-checked screening references, not locally validated agronomic prescriptions.
 * Unknown values stay null. Numeric soil points are an engine policy, not a field measurement.
 */
export const referenceSources = {
  water: {
    organization: 'FAO',
    url: 'https://www.fao.org/4/s2022e/s2022e02.htm',
    citation:
      'Irrigation Water Management: Irrigation Water Needs, chapter 2, tables 4 and 5. Indicative crop durations and evapotranspiration ranges; rice excludes additional land preparation/percolation water.',
  },
  rice: {
    organization: 'FAO',
    url: 'https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=1574',
    citation:
      'Ecocrop Oryza sativa data sheet: optimal temperature 20–30°C; absolute pH 4.5–9. Annual rainfall is deliberately not used as seasonal rainfall.',
  },
  aman: {
    organization: 'DAE / BAMIS',
    url: 'https://www.bamis.gov.bd/res/public/calendars/2019/08/04/4336.pdf',
    citation:
      'Bogura-region Aman calendar, July–November. Month-level establishment window; cultivar-specific duration requires local confirmation.',
  },
  lentil: {
    organization: 'DAE / BAMIS',
    url: 'https://www.bamis.gov.bd/res/public/calendars/2019/11/07/8367.pdf',
    citation:
      'Bogura-region lentil calendar: November establishment, 119-day duration; stage temperature ranges span 10–25°C.',
  },
  mustard: {
    organization: 'DAE / BAMIS',
    url: 'https://www.bamis.gov.bd/res/public/calendars/2019/12/30/10981.pdf',
    citation:
      'Dhaka-region mustard calendar: November establishment, 80–100-day duration; favorable temperature 15–27°C. Calendar month is normalized to a month-level screening window, not an optimal sowing deadline.',
  },
  wheat: {
    organization: 'DAE / BAMIS',
    url: 'https://www.bamis.gov.bd/en/croppnp/1/all/9/',
    citation:
      'Wheat cultivation practices: ideal sowing 15–30 November. Duration and water reference separately use FAO tables 4 and 5.',
  },
  mung: {
    organization: 'DAE / BAMIS',
    url: 'https://www.bamis.gov.bd/res/public/calendars/2019/12/30/10927.pdf',
    citation:
      'Bogura-region Kharif-1 mung calendar, April establishment, 65–70-day duration; favorable growth temperature 28–30°C. Month-level screening window.',
  },
  pulses: {
    organization: 'FAO',
    url: 'https://www.fao.org/newsroom/story/Pulses-and-soils-a-dynamic-duo/en',
    citation:
      'Pulses and soils: a dynamic duo. Biological nitrogen fixation and pulses in rice rotations. Benefits depend on residues and management; no kg/ha nitrogen credit is assumed.',
  },
} as const

export const bangladeshCrops = [
  {
    name: 'Aman',
    family: 'Poaceae',
    season: 'Kharif 2',
    start: [7, 1],
    end: [7, 31],
    duration: [90, 150],
    temperature: [20, 30],
    ph: [4.5, 9],
    water: 575,
    legume: false,
    calendar: 'aman',
    durationSource: 'water',
    waterSource: 'water',
    temperatureSource: 'rice',
  },
  {
    name: 'Lentil',
    family: 'Fabaceae',
    season: 'Rabi',
    start: [11, 1],
    end: [11, 30],
    duration: [119, 119],
    temperature: [10, 25],
    ph: null,
    water: null,
    legume: true,
    calendar: 'lentil',
    durationSource: 'lentil',
    waterSource: null,
    temperatureSource: 'lentil',
  },
  {
    name: 'Rape & Mustard',
    family: 'Brassicaceae',
    season: 'Rabi',
    start: [11, 1],
    end: [11, 30],
    duration: [80, 100],
    temperature: [15, 27],
    ph: null,
    water: null,
    legume: false,
    calendar: 'mustard',
    durationSource: 'mustard',
    waterSource: null,
    temperatureSource: 'mustard',
  },
  {
    name: 'Wheat',
    family: 'Poaceae',
    season: 'Rabi',
    start: [11, 15],
    end: [11, 30],
    duration: [120, 150],
    temperature: null,
    ph: null,
    water: 550,
    legume: false,
    calendar: 'wheat',
    durationSource: 'water',
    waterSource: 'water',
    temperatureSource: null,
  },
  {
    name: 'Mug',
    family: 'Fabaceae',
    season: 'Kharif 1',
    start: [4, 1],
    end: [4, 30],
    duration: [65, 70],
    temperature: [28, 30],
    ph: null,
    water: null,
    legume: true,
    calendar: 'mung',
    durationSource: 'mung',
    waterSource: null,
    temperatureSource: 'mung',
  },
] as const

export const referenceScope =
  'Indicative Bangladesh screening baseline. Some calendars come from Bogura or Dhaka, not this specific farm. Dates use published month-level windows and midpoint durations; confirm your variety, district timing and nursery/field preparation with local DAE advice. This is not an agronomist-approved prescription.'
