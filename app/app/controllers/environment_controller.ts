import { refreshNasaProfile } from '#services/nasa_power_service'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'

export default class EnvironmentController {
  async refresh({ auth, params, response }: HttpContext) {
    try {
      return response.ok(await refreshNasaProfile(Number(params.id), auth.user!.id))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ENVIRONMENT_REFRESH_FAILED'
      if (message === 'FARM_NOT_FOUND') return response.notFound({ error: message })
      return response.serviceUnavailable({ error: message })
    }
  }

  async show({ auth, params, response }: HttpContext) {
    const farm = await db
      .from('farms')
      .where({ farm_id: params.id, user_id: auth.user!.id })
      .first()
    if (!farm) return response.notFound({ error: 'FARM_NOT_FOUND' })
    const profile = await db
      .from('farm_environment_profiles')
      .where('farm_id', params.id)
      .orderBy('calculated_at', 'desc')
      .first()
    return profile
      ? response.ok(profile)
      : response.notFound({ error: 'ENVIRONMENT_PROFILE_MISSING' })
  }
}
