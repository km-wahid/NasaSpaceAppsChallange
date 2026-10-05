import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import {
  buildWaterOutlook,
  presentRotationPlans,
  nextPlanningSeason,
  type WaterLevel,
} from '#services/farmer_analysis_service'
import { generateFarmRecommendations, RecommendationError } from '#services/recommendation_service'
import {
  validCoordinates,
  reverseGeocode,
  extractLocation,
  LocationError,
} from '#services/location_service'

const missingMessages: Record<string, string> = {
  ENVIRONMENT_PROFILE_MISSING:
    'Refresh your farm’s environmental information before building rotations.',
  ENVIRONMENT_PROFILE_STALE: 'Your farm’s environmental information needs a refresh.',
  SOIL_PROFILE_MISSING: 'Add your farm’s soil test to check which crops fit.',
  SOIL_NUTRIENTS_INCOMPLETE: 'Complete your soil nutrient information.',
  PREFERENCES_MISSING: 'Save what matters most to you: water, soil, income and resilience.',
  HISTORY_INCOMPLETE: 'Add your previous crops so the plan can check crop breaks.',
  CURATED_CROP_DATA_MISSING: 'Reviewed crop information is not ready for this district yet.',
  CROP_ECONOMICS_MISSING:
    'Local prices, yields and costs are missing. Use the season-based planner without profit comparison.',
  NO_FEASIBLE_ROTATION:
    'No suitable rotation passed the checks. Review water, soil and growing windows.',
  ENVIRONMENT_SEASON_MISSING: 'Some seasonal environmental information is missing.',
  ENGINE_VERSION_MISSING: 'Rotation planning is temporarily unavailable.',
}

export default class FarmerAnalysisController {
  async analyze({ auth, request, response }: HttpContext) {
    response.header('Cache-Control', 'no-store')
    const input = request.only([
      'districtId',
      'latitude',
      'longitude',
      'waterAvailability',
      'farmId',
    ])
    if (
      input.waterAvailability !== undefined &&
      !['low', 'medium', 'high'].includes(input.waterAvailability)
    )
      return response.unprocessableEntity({
        error: 'Please choose High, Medium or Low water availability.',
      })
    if (
      (input.latitude !== undefined || input.longitude !== undefined) &&
      !validCoordinates(input.latitude, input.longitude)
    )
      return response.unprocessableEntity({
        error: 'Your location coordinates are invalid. Select your district manually.',
      })
    if (input.districtId === undefined && validCoordinates(input.latitude, input.longitude)) {
      try {
        const districts = await db.from('districts').select('district_id', 'district_name')
        input.districtId = extractLocation(
          await reverseGeocode(input.latitude, input.longitude),
          districts
        ).districtId
      } catch (error) {
        if (!(error instanceof LocationError)) throw error
        return response.status(error.status).send({ error: error.message })
      }
    }
    if (!/^\d+$/.test(String(input.districtId)) || !Number.isSafeInteger(Number(input.districtId)))
      return response.unprocessableEntity({ error: 'Select a supported Bangladesh district.' })
    const district = await db.from('districts').where('district_id', input.districtId).first()
    if (!district) return response.notFound({ error: 'District not found.' })
    let farm: Record<string, any> | null = null
    if (input.farmId !== undefined) {
      if (!auth.user)
        return response.unauthorized({ error: 'Please sign in to use your saved farm.' })
      if (!/^\d+$/.test(String(input.farmId)) || !Number.isSafeInteger(Number(input.farmId)))
        return response.unprocessableEntity({ error: 'Select a valid farm.' })
      farm = await db
        .from('farms')
        .where({ farm_id: input.farmId, user_id: auth.user.id, district_id: district.district_id })
        .first()
      if (!farm)
        return response.notFound({ error: 'No farm was found for this account and district.' })
    }
    const batch = await db.from('import_batches').orderBy('imported_at', 'desc').first()
    const version = await db.from('engine_versions').where('is_active', true).first()
    const [rainfall, risk, soil] = batch
      ? await Promise.all([
          db
            .from('district_season_climate as c')
            .join('seasons as s', 's.season_id', 'c.season_id')
            .where({ 'c.district_id': district.district_id, 'c.batch_id': batch.batch_id })
            .select('s.season_name', 'c.rainfall_mm'),
          db
            .from('district_risk_assessments')
            .where({ district_id: district.district_id, batch_id: batch.batch_id })
            .first(),
          db
            .from('district_soil_profiles')
            .where({ district_id: district.district_id, batch_id: batch.batch_id })
            .first(),
        ])
      : [[], null, null]
    const water = buildWaterOutlook(
      rainfall,
      (input.waterAvailability ?? null) as WaterLevel | null,
      version?.scoring_config?.seasonMonths ?? {},
      risk,
      soil
    )
    if (auth.user && input.waterAvailability !== undefined)
      await db
        .from('user_locations')
        .where({ user_id: auth.user.id, district_id: district.district_id })
        .update({ water_availability: input.waterAvailability })
    let plans: ReturnType<typeof presentRotationPlans> = []
    let planning = {
      status: 'needs-farm',
      message: auth.user
        ? 'Choose or add your farm to build rotations that fit its soil, history and water supply.'
        : 'Sign in and add your farm to build rotations that fit its soil, history and water supply.',
    }
    if (farm) {
      try {
        const nextSeason = nextPlanningSeason(version?.scoring_config?.seasonMonths ?? {})
        const season = await db
          .from('seasons')
          .where('season_name', nextSeason?.name ?? '')
          .first()
        const result = await generateFarmRecommendations(auth.user!.id, Number(farm.farm_id), {
          startSeasonId: Number(season?.season_id),
          startYear: nextSeason?.year,
          allowIncompleteFarm: true,
        })
        plans = presentRotationPlans(result.recommendations, result.runId, result.missingChecks)
        planning = {
          status: plans.length ? 'ready' : 'no-feasible-plans',
          message: plans.length
            ? result.missingChecks.length
              ? 'Season-based options ranked by your priorities. Optional farm checks are incomplete; confirm local suitability before planting.'
              : 'Planning from the next full season, compared using your saved priorities for water, soil, climate, resilience and income.'
            : 'No suitable rotation passed the checks. Review your farm inputs.',
        }
      } catch (error) {
        if (!(error instanceof RecommendationError)) throw error
        planning = {
          status: error.details.error.toLowerCase(),
          message:
            missingMessages[error.details.error] ??
            'Some farm information is missing. Please review your saved inputs.',
        }
      }
    }
    return response.ok({
      location: {
        districtId: String(district.district_id),
        district: district.district_name,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      },
      water,
      plans,
      planning,
      contextNote:
        'Historical district references and your water choice guide this outlook. Rotations use measured farm inputs and a cached environmental profile; this is not a forecast.',
      source: batch
        ? { filename: batch.source_filename, reportingYear: batch.reporting_year }
        : null,
    })
  }
}
