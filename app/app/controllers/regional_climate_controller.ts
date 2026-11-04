import type { HttpContext } from '@adonisjs/core/http'
import { getRegionalClimateMap } from '#services/regional_climate_service'

export default class RegionalClimateController {
  async show({ response, logger }: HttpContext) {
    try {
      const map = await getRegionalClimateMap()
      response.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
      return response.ok(map)
    } catch (error) {
      logger.error({ error }, 'NASA POWER regional climate map failed')
      return response.serviceUnavailable({
        error: 'NASA regional climate map is temporarily unavailable. Please try again.',
      })
    }
  }
}
