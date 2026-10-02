import { DistrictSchema } from '#database/schema'
import AgriculturalPlot from '#models/agricultural_plot'
import CropStatistic from '#models/district_crop_statistic'
import RiskAssessment from '#models/district_risk_assessment'
import SeasonClimate from '#models/district_season_climate'
import SoilProfile from '#models/district_soil_profile'
import Division from '#models/division'
import ExtremeWeatherEvent from '#models/extreme_weather_event'
import SoilTest from '#models/soil_test'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class District extends DistrictSchema {
  @belongsTo(() => Division)
  declare division: BelongsTo<typeof Division>

  @hasMany(() => SoilProfile)
  declare soilProfiles: HasMany<typeof SoilProfile>

  @hasMany(() => RiskAssessment)
  declare riskAssessments: HasMany<typeof RiskAssessment>

  @hasMany(() => SeasonClimate)
  declare seasonClimates: HasMany<typeof SeasonClimate>

  @hasMany(() => CropStatistic)
  declare cropStatistics: HasMany<typeof CropStatistic>

  @hasMany(() => ExtremeWeatherEvent)
  declare extremeWeatherEvents: HasMany<typeof ExtremeWeatherEvent>

  @hasMany(() => SoilTest)
  declare soilTests: HasMany<typeof SoilTest>

  @hasMany(() => AgriculturalPlot)
  declare agriculturalPlots: HasMany<typeof AgriculturalPlot>
}
