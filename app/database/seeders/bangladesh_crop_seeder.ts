import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import {
  bangladeshCrops,
  referenceSources,
  referenceScope,
} from '../reference_data/bangladesh_crops.js'

/** Safe to rerun after workbook import. Never overwrites existing curated rows. */
export default class extends BaseSeeder {
  async run() {
    await db.transaction(async (trx) => {
      const sources: Record<string, number> = {}
      for (const [key, source] of Object.entries(referenceSources)) {
        let existing = await trx.from('data_sources').where('url', source.url).first()
        if (!existing)
          [existing] = await trx
            .table('data_sources')
            .insert({
              ...source,
              name: `Starter reference · ${key}`,
              notes:
                'Source checked during implementation; not a claim of independent agronomist review. Retained unknown fields require further curation.',
            })
            .returning('*')
        sources[key] = Number(existing.source_id)
      }
      for (const reference of bangladeshCrops) {
        const crop = await trx.from('crops').where('crop_name', reference.name).first()
        const season = await trx.from('seasons').where('season_name', reference.season).first()
        if (!crop || !season) continue // Workbook import is a separate explicit operation.
        const verifiedAt = '2026-10-04'
        await trx
          .table('crop_requirements')
          .insert({
            crop_id: crop.crop_id,
            botanical_family: reference.family,
            rainfall_min_mm: null,
            rainfall_max_mm: null,
            water_requirement_mm: reference.water,
            ph_min: reference.ph?.[0] ?? null,
            ph_max: reference.ph?.[1] ?? null,
            nitrogen_requirement: null,
            phosphorus_requirement: null,
            potassium_requirement: null,
            nitrogen_contribution_level: null,
            heat_tolerance: null,
            drought_tolerance: null,
            flood_tolerance: null,
            salinity_tolerance: null,
            crop_soil_effect_points: reference.legume ? 20 : null,
            source_id: sources[reference.legume ? 'pulses' : reference.calendar],
            reviewed_at: verifiedAt,
            reference_details: {
              dataset: 'bangladesh-screening-v1',
              temperatureRange: reference.temperature,
              scopeNote: referenceScope,
              soilNote: reference.legume
                ? 'Potential nitrogen-fixing legume. Soil benefit depends on residue retention, nodulation and nutrient management.'
                : 'No quantified soil-effect reference is included for this crop.',
              fieldSources: {
                calendar: referenceSources[reference.calendar].url,
                duration: referenceSources[reference.durationSource].url,
                temperature: reference.temperatureSource
                  ? referenceSources[reference.temperatureSource].url
                  : null,
                water: reference.waterSource ? referenceSources[reference.waterSource].url : null,
                soil: reference.legume ? referenceSources.pulses.url : null,
              },
            },
          })
          .onConflict('crop_id')
          .ignore()
        const existingCalendar = await trx
          .from('crop_calendar_windows')
          .where({ crop_id: crop.crop_id, season_id: season.season_id })
          .whereNull('district_id')
          .first()
        if (!existingCalendar)
          await trx.table('crop_calendar_windows').insert({
            crop_id: crop.crop_id,
            season_id: season.season_id,
            district_id: null,
            sowing_start_month: reference.start[0],
            sowing_start_day: reference.start[1],
            sowing_end_month: reference.end[0],
            sowing_end_day: reference.end[1],
            duration_min_days: reference.duration[0],
            duration_max_days: reference.duration[1],
            source_id: sources[reference.calendar],
            reviewed_at: verifiedAt,
          })
      }
    })
  }
}
