import { BaseCommand, args } from '@adonisjs/core/ace'
import { refreshNasaProfile } from '#services/nasa_power_service'

export default class RefreshNasaProfile extends BaseCommand {
  static commandName = 'nasa:refresh-profile'
  static description = 'Refresh or upgrade the cached NASA POWER profile for one owned farm'
  static options = { startApp: true }

  @args.string({ description: 'Farm ID' })
  declare farmId: string

  @args.string({ description: 'Owner user ID' })
  declare userId: string

  async run() {
    const farmId = Number(this.farmId)
    const userId = Number(this.userId)
    if (!Number.isInteger(farmId) || farmId < 1 || !Number.isInteger(userId) || userId < 1) {
      this.logger.error('Farm ID and owner user ID must be positive integers.')
      this.exitCode = 1
      return
    }
    const profile = await refreshNasaProfile(farmId, userId)
    this.logger.success(
      `NASA profile ${profile.environment_profile_id} is ready for farm ${farmId}.`
    )
  }
}
