import type { RotationPlan } from '../components/rotation_plans'

// Presentation fixtures only: never submit these to the recommendation or farm APIs.
export const demoRotations: RotationPlan[] = ['Lentil', 'Mustard', 'Wheat'].map((crop, index) => ({
  id: `demo-${index}`,
  demo: true,
  label: `Sample Plan ${String.fromCharCode(65 + index)}`,
  waterDemand: index === 0 ? 'low' : 'medium',
  fit: 'Seasonal preview',
  soilHealth: 'Sample soil-health outlook',
  crops: [
    {
      name: crop,
      plantingDate: '2026-11-15',
      harvestDate: '2027-03-15',
      waterNeed: index === 2 ? 'medium' : 'low',
    },
    { name: 'Mungbean', plantingDate: '2027-04-01', harvestDate: '2027-06-10', waterNeed: 'low' },
    { name: 'Aman rice', plantingDate: '2027-07-01', harvestDate: '2027-11-01', waterNeed: 'high' },
  ].map((item, i, crops) => ({
    ...item,
    waterNeed: item.waterNeed as 'low' | 'medium' | 'high',
    id: index * 3 + i,
    condition: 'Seasonal preview',
    reason: 'Explore this crop’s place in a multi-season growing calendar.',
    nextCrop: crops[i + 1]?.name ?? 'Review the next year with local advice',
    soilContribution:
      item.name === 'Lentil' || item.name === 'Mungbean'
        ? 'Legume slot — potential nitrogen support'
        : 'Non-legume slot — varies with soil management',
  })),
  reasons: [
    {
      kind: 'water',
      title: 'Seasonal water planning',
      text: 'Compare crop water needs across the growing calendar.',
    },
    {
      kind: 'soil',
      title: 'Crop diversity',
      text: 'Explore different crops across the year, including a legume slot.',
    },
    {
      kind: 'climate',
      title: 'Space between crops',
      text: 'The calendar leaves gaps for harvest and land preparation.',
    },
  ],
  tradeoffs: [],
}))
