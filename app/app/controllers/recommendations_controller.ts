import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { generateFarmRecommendations, RecommendationError } from '#services/recommendation_service'

export default class RecommendationsController {
  async store({ auth, params, request, response }: HttpContext) {
    try {
      const result = await generateFarmRecommendations(auth.user!.id, Number(params.id), {
        startSeasonId: Number(request.input('startSeasonId')),
        minimumDistinctCrops: Number(request.input('constraints.minimumDistinctCrops', 2)),
        allowAdjacentRepeat: Boolean(request.input('constraints.allowAdjacentRepeat', false)),
      })
      return response.created(result)
    } catch (error) {
      if (!(error instanceof RecommendationError)) throw error
      return response.status(error.status).send(error.details)
    }
  }

  async show({ auth, params, response }: HttpContext) {
    const run = await db
      .from('recommendation_runs as run')
      .join('farms as farm', 'farm.farm_id', 'run.farm_id')
      .where({ 'run.recommendation_run_id': params.runId, 'farm.user_id': auth.user!.id })
      .select('run.*')
      .first()
    if (!run) return response.notFound({ error: 'RECOMMENDATION_NOT_FOUND' })
    const recommendations = await db
      .from('rotation_recommendations')
      .where('recommendation_run_id', run.recommendation_run_id)
      .orderBy('rank')
    for (const recommendation of recommendations) {
      recommendation.items = await db
        .from('rotation_recommendation_items as item')
        .join('crops as crop', 'crop.crop_id', 'item.crop_id')
        .join('seasons as season', 'season.season_id', 'item.season_id')
        .where('item.recommendation_id', recommendation.recommendation_id)
        .select('item.*', 'crop.crop_name', 'season.season_name')
        .orderBy('position')
      recommendation.explanations = await db
        .from('recommendation_explanations')
        .where('recommendation_id', recommendation.recommendation_id)
        .orderBy('sort_order')
    }
    return response.ok({ run, recommendations })
  }
}
