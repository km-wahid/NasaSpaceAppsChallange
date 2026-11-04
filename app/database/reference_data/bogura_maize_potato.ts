import type { ImportDocument } from '#services/integrated_farming_import_service'

export const boguraMaizePotatoPilot = {
  sources: [
    {
      key: 'trial',
      name: 'BARI maize-potato intercropping trial',
      organization: 'Bangladesh Agricultural Research Institute / Tropical Agroecosystems',
      documentTitle:
        'Comprehensive Analysis of Efficiency and Economic Viability in Maize-Potato Intercropping',
      publicationDate: '2025-01-01',
      url: 'https://taec.com.my/archives/1taec2025/1taec2025-23-28.pdf',
      citation:
        'Khanum et al. (2025), Tropical Agroecosystems 6(1), 23-28; two Rabi seasons at BARI Rajbari, Dinajpur.',
      pageOrTable: 'Methods section 2; Tables 1-4; treatment T5',
      notes:
        'Supplies the exact layout, component yields, system-level variable cost and historical study prices. Transfer to Bogura requires local extension review.',
    },
    {
      key: 'barc_economics',
      name: 'BARC Bogura Sadar crop economics',
      organization: 'Bangladesh Agricultural Research Council Crop Zoning Project',
      url: 'https://portal.cropzoning.gov.bd/CropEconomics?distcode=5010&upcode=501020',
      citation:
        'Official upazila crop-economics records list Rabi maize and potato under favourable environments in Bogura Sadar.',
      notes:
        'Supports local economic relevance of both component crops, but does not report current intercropping prices or component-level costs.',
    },
    {
      key: 'barc_technology',
      name: 'BARC crop production technology',
      organization: 'Bangladesh Agricultural Research Council / BARI',
      url: 'https://portal.cropzoning.gov.bd/CropInfo/ProductionTechs?c=36',
      citation:
        'Official potato production record: optimum sowing 15-30 November and irrigation around 20-25, 35-45 and 60-65 days after sowing.',
      notes: 'The three-irrigation check is qualitative; no irrigation depth is inferred.',
    },
    {
      key: 'barc_soil',
      name: 'SRDI soil health maps for Bogura Sadar',
      organization: 'Soil Resource Development Institute / BARC Crop Zoning Project',
      url: 'https://portal.cropzoning.gov.bd/SoilHealth?distcode=5010&upcode=501020',
      citation:
        '2019 regional pH and nutrient-status maps for Bogura Sadar published through the BARC Crop Zoning portal.',
      notes:
        'Regional context only. These maps are not stored as a field soil measurement; a field test still requires review.',
    },
  ],
  systems: [
    {
      name: 'Bogura pilot · BARI Hybrid Maize-16 + BARI Potato-36',
      type: 'intercrop',
      timingPattern: 'simultaneous',
      spatialPattern: 'alternate_rows',
      source: 'trial',
      season: 'Rabi',
      district: 'Bogura',
      reviewedAt: '2026-10-26',
      managementNote:
        'Evidence-transfer pilot: paired maize rows at 30/120/30 cm with 20 cm maize spacing and three potato rows. The trial sowed both crops together in mid-November, harvested potato at 80 days, and continued maize. Confirm soil, irrigation, input plan, integrated pest management and current economics with local extension staff before use.',
      components: [
        {
          cropName: 'Maize',
          role: 'primary',
          startOffsetDays: 0,
          durationDays: 145,
          expectedOutputPerHa: 9.75,
          outputUnit: 'tonnes',
          marketPriceBdtPerUnit: 12000,
          variableCostBdtPerHa: 45320,
          annualizedSetupCostBdtPerHa: 0,
          economicSource: 'trial',
          uncertaintyNote:
            'Yield and price are the two-season trial values. The paper reports Tk 110,100/ha only at system level; Tk 45,320 is a transparent allocation using the sole-crop cost shares.',
        },
        {
          cropName: 'Potato',
          role: 'companion',
          startOffsetDays: 0,
          durationDays: 80,
          expectedOutputPerHa: 37.85,
          outputUnit: 'tonnes',
          marketPriceBdtPerUnit: 10000,
          variableCostBdtPerHa: 64780,
          annualizedSetupCostBdtPerHa: 0,
          economicSource: 'trial',
          uncertaintyNote:
            'Yield and price are the two-season trial values. The paper reports Tk 110,100/ha only at system level; Tk 64,780 is a transparent allocation using the sole-crop cost shares.',
        },
      ],
      requirements: [
        {
          metric: 'capability.field_soil_test_reviewed',
          comparator: 'equals',
          booleanValue: true,
          source: 'barc_soil',
        },
        {
          metric: 'capability.three_rabi_irrigations_available',
          comparator: 'equals',
          booleanValue: true,
          source: 'barc_technology',
        },
        {
          metric: 'capability.current_local_economics_reviewed',
          comparator: 'equals',
          booleanValue: true,
          source: 'barc_economics',
        },
        {
          metric: 'capability.local_extension_review',
          comparator: 'equals',
          booleanValue: true,
          source: 'trial',
        },
      ],
    },
  ],
} satisfies ImportDocument
