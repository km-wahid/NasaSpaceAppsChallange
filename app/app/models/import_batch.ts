import { ImportBatchSchema } from '#database/schema'
import CropStatistic from '#models/district_crop_statistic'
import RiskAssessment from '#models/district_risk_assessment'
import SeasonClimate from '#models/district_season_climate'
import SoilProfile from '#models/district_soil_profile'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class ImportBatch extends ImportBatchSchema {
  @hasMany(() => SoilProfile)
  declare soilProfiles: HasMany<typeof SoilProfile>

  @hasMany(() => RiskAssessment)
  declare riskAssessments: HasMany<typeof RiskAssessment>

  @hasMany(() => SeasonClimate)
  declare seasonClimates: HasMany<typeof SeasonClimate>

  @hasMany(() => CropStatistic)
  declare cropStatistics: HasMany<typeof CropStatistic>
}
