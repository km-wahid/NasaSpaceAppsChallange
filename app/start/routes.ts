/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

const FarmsController = () => import('#controllers/farms_controller')
const EnvironmentController = () => import('#controllers/environment_controller')
const RecommendationsController = () => import('#controllers/recommendations_controller')

router.on('/').renderInertia('home', {}).as('home')
router.get('/api/v1/catalog', [() => import('#controllers/catalog_controller'), 'index'])

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.Session, 'destroy'])

    router.get('api/v1/farms', [FarmsController, 'index'])
    router.post('api/v1/farms', [FarmsController, 'store'])
    router.get('api/v1/farms/:id', [FarmsController, 'show'])
    router.get('api/v1/farms/:id/inputs', [FarmsController, 'inputs'])
    router.put('api/v1/farms/:id/preferences', [FarmsController, 'preferences'])
    router.put('api/v1/farms/:id/soil', [FarmsController, 'soil'])
    router.put('api/v1/farms/:id/history', [FarmsController, 'history'])
    router.get('api/v1/farms/:id/crops', [FarmsController, 'crops'])
    router.get('api/v1/farms/:id/environment', [EnvironmentController, 'show'])
    router.post('api/v1/farms/:id/environment/refresh', [EnvironmentController, 'refresh'])
    router.post('api/v1/farms/:id/recommendations', [RecommendationsController, 'store'])
    router.get('api/v1/farms/:id/recommendations/:runId', [RecommendationsController, 'show'])
  })
  .use(middleware.auth())
