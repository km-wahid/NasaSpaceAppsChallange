import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import { importIntegratedFarming } from '#services/integrated_farming_import_service'
import { boguraMaizePotatoPilot } from '../reference_data/bogura_maize_potato.js'

const cropRecords = [
  {
    crop_name: 'Maize',
    crop_category: 'Cereal',
    growth_period: '140-145 days for BARI Hybrid Maize-16',
    harvest_period: 'Rabi',
    soil_health_role: 'No quantified soil benefit claimed',
    recommended_rotation_role: 'Primary intercrop component',
    biological_nitrogen_fixation_kg_ha: 0,
    water_demand_category: 'Medium',
    estimated_water_need_mm: 650,
    rooting_depth: 'Not established by the cited package',
    drought_tolerance: 'medium',
    salinity_tolerance: 'high',
    flood_tolerance: 'low',
    soil_health_score: 5,
    water_conservation_score: 5,
    economic_resilience_score: 5,
  },
  {
    crop_name: 'Potato',
    crop_category: 'Tuber crop',
    growth_period: '90-95 days for BARI Potato-36; 80 days in the cited trial',
    harvest_period: 'Rabi',
    soil_health_role: 'No quantified soil benefit claimed',
    recommended_rotation_role: 'Companion intercrop component',
    biological_nitrogen_fixation_kg_ha: 0,
    water_demand_category: 'Medium',
    estimated_water_need_mm: 600,
    rooting_depth: 'Not established by the cited package',
    drought_tolerance: 'low',
    salinity_tolerance: 'low',
    flood_tolerance: 'low',
    soil_health_score: 5,
    water_conservation_score: 5,
    economic_resilience_score: 5,
  },
]

export default class extends BaseSeeder {
  async run() {
    const district = await db.from('districts').where('district_name', 'Bogura').first()
    const season = await db.from('seasons').where('season_name', 'Rabi').first()
    if (!district || !season) return

    await db.transaction(async (trx) => {
      for (const crop of cropRecords)
        await trx.table('crops').insert(crop).onConflict('crop_name').ignore()

      const trialSource = await trx
        .from('data_sources')
        .where('url', boguraMaizePotatoPilot.sources[0].url)
        .first()
      let sourceId = trialSource?.source_id
      if (!sourceId) {
        const [created] = await trx
          .table('data_sources')
          .insert({
            name: boguraMaizePotatoPilot.sources[0].name,
            organization: boguraMaizePotatoPilot.sources[0].organization,
            document_title: boguraMaizePotatoPilot.sources[0].documentTitle,
            publication_date: boguraMaizePotatoPilot.sources[0].publicationDate,
            url: boguraMaizePotatoPilot.sources[0].url,
            citation: boguraMaizePotatoPilot.sources[0].citation,
            page_or_table: boguraMaizePotatoPilot.sources[0].pageOrTable,
            notes: boguraMaizePotatoPilot.sources[0].notes,
          })
          .returning('source_id')
        sourceId = created.source_id
      }

      for (const cropRecord of cropRecords) {
        const crop = await trx.from('crops').where('crop_name', cropRecord.crop_name).firstOrFail()
        await trx
          .table('crop_requirements')
          .insert({
            crop_id: crop.crop_id,
            botanical_family: cropRecord.crop_name === 'Maize' ? 'Poaceae' : 'Solanaceae',
            rainfall_min_mm: null,
            rainfall_max_mm: null,
            // The reviewed package confirms irrigation timing, not a seasonal millimetre total.
            // Keep this unknown so a generic crop-water gate cannot turn an unsupported estimate
            // into a hard rejection; the package's explicit irrigation capability remains mandatory.
            water_requirement_mm: null,
            ph_min: null,
            ph_max: null,
            nitrogen_requirement: null,
            phosphorus_requirement: null,
            potassium_requirement: null,
            nitrogen_contribution_level: null,
            heat_tolerance: null,
            drought_tolerance: null,
            flood_tolerance: null,
            salinity_tolerance: null,
            crop_soil_effect_points: null,
            source_id: sourceId,
            reviewed_at: '2026-10-26',
            reference_details: {
              dataset: 'bogura-maize-potato-pilot-v1',
              temperatureRange: null,
              scopeNote:
                'Bogura evidence-transfer screening. Regional soil maps are context only; field soil and local extension review remain mandatory.',
              soilNote: 'No field soil value is inferred or stored.',
            },
          })
          .onConflict('crop_id')
          .ignore()

        await trx
          .from('crop_requirements')
          .where('crop_id', crop.crop_id)
          .whereRaw("reference_details ->> 'dataset' = ?", ['bogura-maize-potato-pilot-v1'])
          .update({ water_requirement_mm: null })

        const existingCalendar = await trx
          .from('crop_calendar_windows')
          .where({
            crop_id: crop.crop_id,
            season_id: season.season_id,
            district_id: district.district_id,
          })
          .first()
        if (!existingCalendar)
          await trx.table('crop_calendar_windows').insert({
            crop_id: crop.crop_id,
            season_id: season.season_id,
            district_id: district.district_id,
            sowing_start_month: 11,
            sowing_start_day: 12,
            sowing_end_month: 11,
            sowing_end_day: 30,
            duration_min_days: cropRecord.crop_name === 'Maize' ? 140 : 80,
            duration_max_days: cropRecord.crop_name === 'Maize' ? 145 : 95,
            source_id: sourceId,
            reviewed_at: '2026-10-26',
          })
      }
    })

    await importIntegratedFarming(boguraMaizePotatoPilot)
  }
}
