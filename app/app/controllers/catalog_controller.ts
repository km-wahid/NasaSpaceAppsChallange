import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'

/** Public reference records only; farmer inputs stay behind authentication. */
export default class CatalogController {
  async index({ request, response }: HttpContext) {
    const requestedId = request.input('districtId')
    if (
      requestedId !== undefined &&
      (!/^\d+$/.test(String(requestedId)) || Number(requestedId) < 1)
    ) {
      return response.unprocessableEntity({ error: 'INVALID_DISTRICT' })
    }
    const districts = await db.from('districts').orderBy('district_name')
    const district =
      requestedId === undefined
        ? (districts.find((row) => row.district_name === 'Bogura') ?? districts[0])
        : districts.find((row) => Number(row.district_id) === Number(requestedId))
    if (!district) return response.notFound({ error: 'DISTRICT_NOT_FOUND' })
    const batch = await db.from('import_batches').orderBy('imported_at', 'desc').first()
    const [divisions, crops, seasons, thresholds, readiness] = await Promise.all([
      db.from('divisions').select('division_id', 'division_name').orderBy('division_name'),
      db.from('crops').select('crop_id', 'crop_name').orderBy('crop_name'),
      db.from('seasons').orderBy('season_id'),
      db
        .from('soil_nutrient_threshold_sets as t')
        .join('soil_nutrient_thresholds as b', 'b.threshold_set_id', 't.threshold_set_id')
        .distinct('t.threshold_set_id', 't.name', 't.unit', 't.analytical_method', 'b.nutrient'),
      db.rawQuery(`SELECT (SELECT count(*)::integer FROM crop_requirements) AS requirements,
        (SELECT count(*)::integer FROM crop_calendar_windows) AS calendars,
        (SELECT count(*)::integer FROM crop_economic_data) AS economics,
        (SELECT count(*)::integer FROM soil_nutrient_threshold_sets) AS nutrient_thresholds`),
    ])
    const reference = batch
      ? await Promise.all([
          db
            .from('district_crop_statistics as stats')
            .join('crops as c', 'c.crop_id', 'stats.crop_id')
            .join('seasons as s', 's.season_id', 'stats.season_id')
            .where('stats.district_id', district.district_id)
            .where('stats.batch_id', batch.batch_id)
            .select(
              'c.crop_id',
              'c.crop_name',
              'c.crop_category',
              'c.estimated_water_need_mm',
              's.season_name',
              'stats.reported_yield_metric_tonnes_per_hectare',
              'stats.area_acres',
              'stats.production_metric_tonnes',
              'stats.data_quality_status'
            )
            .orderBy('c.crop_name'),
          db
            .from('district_soil_profiles')
            .where({ district_id: district.district_id, batch_id: batch.batch_id })
            .first(),
          db
            .from('district_risk_assessments')
            .where({ district_id: district.district_id, batch_id: batch.batch_id })
            .first(),
          db
            .from('district_season_climate as climate')
            .join('seasons as s', 's.season_id', 'climate.season_id')
            .where('climate.district_id', district.district_id)
            .where('climate.batch_id', batch.batch_id)
            .select('s.season_name', 'climate.rainfall_mm')
            .orderBy('s.season_id'),
        ])
      : [[], null, null, []]
    return response.ok({
      districts,
      divisions,
      district,
      crops,
      seasons,
      thresholds,
      statistics: reference[0],
      soil: reference[1],
      risk: reference[2],
      climate: reference[3],
      source: batch
        ? {
            filename: batch.source_filename,
            reportingYear: batch.reporting_year,
            importedAt: batch.imported_at,
          }
        : null,
      readiness: readiness.rows[0],
    })
  }
}
