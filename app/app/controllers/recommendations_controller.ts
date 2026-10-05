import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { generateFarmRecommendations, RecommendationError } from '#services/recommendation_service'

export default class RecommendationsController {
  async choose(context: HttpContext) {
    const { auth, params, request, response } = context
    const { runId, rank } = request.only(['runId', 'rank'])
    if (
      !/^\d+$/.test(String(params.id)) ||
      !Number.isSafeInteger(Number(params.id)) ||
      !/^\d+$/.test(String(runId)) ||
      !Number.isSafeInteger(Number(runId)) ||
      Number(runId) < 1 ||
      ![1, 2, 3].includes(rank)
    )
      return response.unprocessableEntity({ error: 'Choose a valid rotation plan.' })
    const recommendation = await db
      .from('rotation_recommendations as r')
      .join('recommendation_runs as run', 'run.recommendation_run_id', 'r.recommendation_run_id')
      .join('farms as farm', 'farm.farm_id', 'run.farm_id')
      .where({
        'run.farm_id': params.id,
        'farm.user_id': auth.user!.id,
        'run.status': 'completed',
        'r.recommendation_run_id': runId,
        'r.rank': rank,
      })
      .select('r.recommendation_id', 'run.farm_id')
      .first()
    if (!recommendation)
      return response.notFound({ error: 'This rotation was not found for your farm.' })
    await db
      .table('farm_rotation_choices')
      .insert({
        farm_id: recommendation.farm_id,
        recommendation_id: recommendation.recommendation_id,
        selected_at: new Date(),
      })
      .onConflict('farm_id')
      .merge()
    return this.choice(context)
  }

  async choice({ auth, params, response }: HttpContext) {
    if (!/^\d+$/.test(String(params.id)) || !Number.isSafeInteger(Number(params.id)))
      return response.unprocessableEntity({ error: 'Select a valid farm.' })
    const farm = await db
      .from('farms')
      .where({ farm_id: params.id, user_id: auth.user!.id })
      .first()
    if (!farm) return response.notFound({ error: 'Farm not found.' })
    const choice = await db
      .from('farm_rotation_choices as choice')
      .join('rotation_recommendations as r', 'r.recommendation_id', 'choice.recommendation_id')
      .where('choice.farm_id', farm.farm_id)
      .select(
        'choice.selected_at as selectedAt',
        'r.recommendation_run_id as runId',
        'r.rank',
        'r.recommendation_id'
      )
      .first()
    if (!choice) return response.ok(null)
    const crops = await db
      .from('rotation_recommendation_items as item')
      .join('crops as crop', 'crop.crop_id', 'item.crop_id')
      .where('item.recommendation_id', choice.recommendation_id)
      .select(
        'crop.crop_name as name',
        'item.planting_date as plantingDate',
        'item.harvest_date as harvestDate'
      )
      .orderBy('item.position')
    return response.ok({
      runId: String(choice.runId),
      rank: choice.rank,
      selectedAt: choice.selectedAt,
      crops,
    })
  }

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
