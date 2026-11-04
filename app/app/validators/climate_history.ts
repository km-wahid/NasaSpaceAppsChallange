import vine from '@vinejs/vine'

export const climateHistoryValidator = vine.create({
  districtId: vine.number().positive().withoutDecimals().optional(),
  latitude: vine.number().min(20.3).max(26.8).optional(),
  longitude: vine.number().min(87.7).max(93.1).optional(),
})
