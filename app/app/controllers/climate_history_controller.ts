import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { getPublicClimateHistory } from '#services/public_climate_service'
import { climateHistoryValidator } from '#validators/climate_history'

export default class ClimateHistoryController {
  async show({ request, response, logger }: HttpContext) {
    const input = await request.validateUsing(climateHistoryValidator)
    if ((input.latitude === undefined) !== (input.longitude === undefined))
      return response.unprocessableEntity({
        error: 'Latitude and longitude must be provided together.',
      })

    let district: Record<string, unknown> | null = null
    if (input.districtId !== undefined)
      district = await db.from('districts').where('district_id', input.districtId).first()
    if (input.districtId !== undefined && !district)
      return response.notFound({ error: 'District not found.' })
    if (!district && input.latitude === undefined)
      district =
        (await db.from('districts').where('district_name', 'Bogura').first()) ??
        (await db.from('districts').orderBy('district_id').first())
    if (!district) return response.serviceUnavailable({ error: 'Climate location is unavailable.' })

    const latitude = input.latitude ?? Number(district.latitude)
    const longitude = input.longitude ?? Number(district.longitude)
    try {
      const history = await getPublicClimateHistory(latitude, longitude)
      response.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
      return response.ok({
        ...history,
        locationName: input.latitude === undefined ? district.district_name : 'Your location',
      })
    } catch (error) {
      logger.error({ error }, 'NASA POWER public climate history failed')
      return response.serviceUnavailable({
        error: 'NASA climate history is temporarily unavailable. Please try again.',
      })
    }
  }
}
