import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import {
  extractLocation,
  LocationError,
  reverseGeocode,
  validCoordinates,
} from '#services/location_service'

export default class LocationController {
  private async save(
    userId: number,
    location: ReturnType<typeof extractLocation> & {
      latitude: number | null
      longitude: number | null
    }
  ) {
    await db
      .table('user_locations')
      .insert({
        user_id: userId,
        district_id: location.districtId,
        latitude: location.latitude,
        longitude: location.longitude,
        district: location.district,
        division: location.division,
        country: location.country,
        country_code: location.countryCode,
        water_availability: null,
        updated_at: new Date(),
      })
      .onConflict('user_id')
      .merge()
  }

  async show({ auth, response }: HttpContext) {
    response.header('Cache-Control', 'no-store')
    const location = await db
      .from('user_locations')
      .where('user_id', auth.user!.id)
      .select(
        'latitude',
        'longitude',
        'district',
        'district_id as districtId',
        'division',
        'country',
        'country_code as countryCode',
        'water_availability as waterAvailability'
      )
      .first()
    return response.ok(location ?? null)
  }

  async update({ auth, request, response }: HttpContext) {
    response.header('Cache-Control', 'no-store')
    const districtId = request.input('districtId')
    if (
      !/^\d+$/.test(String(districtId)) ||
      !Number.isSafeInteger(Number(districtId)) ||
      Number(districtId) < 1
    ) {
      return response.unprocessableEntity({ error: 'Select a valid district.' })
    }
    const district = await db
      .from('districts as d')
      .join('divisions as v', 'v.division_id', 'd.division_id')
      .where('d.district_id', districtId)
      .select('d.district_id', 'd.district_name', 'v.division_name')
      .first()
    if (!district) return response.notFound({ error: 'District not found.' })
    const location = {
      latitude: null,
      longitude: null,
      district: district.district_name as string,
      districtId: String(district.district_id),
      division: district.division_name as string,
      country: 'Bangladesh',
      countryCode: 'bd',
    }
    await this.save(auth.user!.id, location)
    return response.ok(location)
  }

  async reverse({ auth, request, response }: HttpContext) {
    response.header('Cache-Control', 'no-store')
    const { latitude, longitude } = request.only(['latitude', 'longitude'])
    if (!validCoordinates(latitude, longitude)) {
      return response.unprocessableEntity({
        error: 'Enter valid latitude and longitude.',
        code: 'INVALID_COORDINATES',
      })
    }
    try {
      const districts = await db.from('districts').select('district_id', 'district_name')
      const data = await reverseGeocode(latitude, longitude)
      const location = { latitude, longitude, ...extractLocation(data, districts) }
      if (auth.user) await this.save(auth.user.id, location)
      return response.ok(location)
    } catch (error) {
      if (!(error instanceof LocationError)) throw error
      if (error.status === 429) response.header('Retry-After', '60')
      return response.status(error.status).send({ error: error.message, code: error.code })
    }
  }
}
