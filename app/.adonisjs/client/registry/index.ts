/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'catalog.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/catalog',
    tokens: [{"old":"/api/v1/catalog","type":0,"val":"api","end":""},{"old":"/api/v1/catalog","type":0,"val":"v1","end":""},{"old":"/api/v1/catalog","type":0,"val":"catalog","end":""}],
    types: placeholder as Registry['catalog.index']['types'],
  },
  'farmer_analysis.analyze': {
    methods: ["POST"],
    pattern: '/api/v1/crop-rotation/analyze',
    tokens: [{"old":"/api/v1/crop-rotation/analyze","type":0,"val":"api","end":""},{"old":"/api/v1/crop-rotation/analyze","type":0,"val":"v1","end":""},{"old":"/api/v1/crop-rotation/analyze","type":0,"val":"crop-rotation","end":""},{"old":"/api/v1/crop-rotation/analyze","type":0,"val":"analyze","end":""}],
    types: placeholder as Registry['farmer_analysis.analyze']['types'],
  },
  'location.reverse': {
    methods: ["POST"],
    pattern: '/api/v1/location/reverse',
    tokens: [{"old":"/api/v1/location/reverse","type":0,"val":"api","end":""},{"old":"/api/v1/location/reverse","type":0,"val":"v1","end":""},{"old":"/api/v1/location/reverse","type":0,"val":"location","end":""},{"old":"/api/v1/location/reverse","type":0,"val":"reverse","end":""}],
    types: placeholder as Registry['location.reverse']['types'],
  },
  'new_account.create': {
    methods: ["GET","HEAD"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['new_account.create']['types'],
  },
  'new_account.store': {
    methods: ["POST"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['new_account.store']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.store']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'location.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/location',
    tokens: [{"old":"/api/v1/location","type":0,"val":"api","end":""},{"old":"/api/v1/location","type":0,"val":"v1","end":""},{"old":"/api/v1/location","type":0,"val":"location","end":""}],
    types: placeholder as Registry['location.show']['types'],
  },
  'location.update': {
    methods: ["PUT"],
    pattern: '/api/v1/location',
    tokens: [{"old":"/api/v1/location","type":0,"val":"api","end":""},{"old":"/api/v1/location","type":0,"val":"v1","end":""},{"old":"/api/v1/location","type":0,"val":"location","end":""}],
    types: placeholder as Registry['location.update']['types'],
  },
  'farms.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/farms',
    tokens: [{"old":"/api/v1/farms","type":0,"val":"api","end":""},{"old":"/api/v1/farms","type":0,"val":"v1","end":""},{"old":"/api/v1/farms","type":0,"val":"farms","end":""}],
    types: placeholder as Registry['farms.index']['types'],
  },
  'farms.store': {
    methods: ["POST"],
    pattern: '/api/v1/farms',
    tokens: [{"old":"/api/v1/farms","type":0,"val":"api","end":""},{"old":"/api/v1/farms","type":0,"val":"v1","end":""},{"old":"/api/v1/farms","type":0,"val":"farms","end":""}],
    types: placeholder as Registry['farms.store']['types'],
  },
  'farms.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/farms/:id',
    tokens: [{"old":"/api/v1/farms/:id","type":0,"val":"api","end":""},{"old":"/api/v1/farms/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/farms/:id","type":0,"val":"farms","end":""},{"old":"/api/v1/farms/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['farms.show']['types'],
  },
  'farms.inputs': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/farms/:id/inputs',
    tokens: [{"old":"/api/v1/farms/:id/inputs","type":0,"val":"api","end":""},{"old":"/api/v1/farms/:id/inputs","type":0,"val":"v1","end":""},{"old":"/api/v1/farms/:id/inputs","type":0,"val":"farms","end":""},{"old":"/api/v1/farms/:id/inputs","type":1,"val":"id","end":""},{"old":"/api/v1/farms/:id/inputs","type":0,"val":"inputs","end":""}],
    types: placeholder as Registry['farms.inputs']['types'],
  },
  'farms.preferences': {
    methods: ["PUT"],
    pattern: '/api/v1/farms/:id/preferences',
    tokens: [{"old":"/api/v1/farms/:id/preferences","type":0,"val":"api","end":""},{"old":"/api/v1/farms/:id/preferences","type":0,"val":"v1","end":""},{"old":"/api/v1/farms/:id/preferences","type":0,"val":"farms","end":""},{"old":"/api/v1/farms/:id/preferences","type":1,"val":"id","end":""},{"old":"/api/v1/farms/:id/preferences","type":0,"val":"preferences","end":""}],
    types: placeholder as Registry['farms.preferences']['types'],
  },
  'farms.soil': {
    methods: ["PUT"],
    pattern: '/api/v1/farms/:id/soil',
    tokens: [{"old":"/api/v1/farms/:id/soil","type":0,"val":"api","end":""},{"old":"/api/v1/farms/:id/soil","type":0,"val":"v1","end":""},{"old":"/api/v1/farms/:id/soil","type":0,"val":"farms","end":""},{"old":"/api/v1/farms/:id/soil","type":1,"val":"id","end":""},{"old":"/api/v1/farms/:id/soil","type":0,"val":"soil","end":""}],
    types: placeholder as Registry['farms.soil']['types'],
  },
  'farms.history': {
    methods: ["PUT"],
    pattern: '/api/v1/farms/:id/history',
    tokens: [{"old":"/api/v1/farms/:id/history","type":0,"val":"api","end":""},{"old":"/api/v1/farms/:id/history","type":0,"val":"v1","end":""},{"old":"/api/v1/farms/:id/history","type":0,"val":"farms","end":""},{"old":"/api/v1/farms/:id/history","type":1,"val":"id","end":""},{"old":"/api/v1/farms/:id/history","type":0,"val":"history","end":""}],
    types: placeholder as Registry['farms.history']['types'],
  },
  'farms.crops': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/farms/:id/crops',
    tokens: [{"old":"/api/v1/farms/:id/crops","type":0,"val":"api","end":""},{"old":"/api/v1/farms/:id/crops","type":0,"val":"v1","end":""},{"old":"/api/v1/farms/:id/crops","type":0,"val":"farms","end":""},{"old":"/api/v1/farms/:id/crops","type":1,"val":"id","end":""},{"old":"/api/v1/farms/:id/crops","type":0,"val":"crops","end":""}],
    types: placeholder as Registry['farms.crops']['types'],
  },
  'environment.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/farms/:id/environment',
    tokens: [{"old":"/api/v1/farms/:id/environment","type":0,"val":"api","end":""},{"old":"/api/v1/farms/:id/environment","type":0,"val":"v1","end":""},{"old":"/api/v1/farms/:id/environment","type":0,"val":"farms","end":""},{"old":"/api/v1/farms/:id/environment","type":1,"val":"id","end":""},{"old":"/api/v1/farms/:id/environment","type":0,"val":"environment","end":""}],
    types: placeholder as Registry['environment.show']['types'],
  },
  'environment.refresh': {
    methods: ["POST"],
    pattern: '/api/v1/farms/:id/environment/refresh',
    tokens: [{"old":"/api/v1/farms/:id/environment/refresh","type":0,"val":"api","end":""},{"old":"/api/v1/farms/:id/environment/refresh","type":0,"val":"v1","end":""},{"old":"/api/v1/farms/:id/environment/refresh","type":0,"val":"farms","end":""},{"old":"/api/v1/farms/:id/environment/refresh","type":1,"val":"id","end":""},{"old":"/api/v1/farms/:id/environment/refresh","type":0,"val":"environment","end":""},{"old":"/api/v1/farms/:id/environment/refresh","type":0,"val":"refresh","end":""}],
    types: placeholder as Registry['environment.refresh']['types'],
  },
  'recommendations.store': {
    methods: ["POST"],
    pattern: '/api/v1/farms/:id/recommendations',
    tokens: [{"old":"/api/v1/farms/:id/recommendations","type":0,"val":"api","end":""},{"old":"/api/v1/farms/:id/recommendations","type":0,"val":"v1","end":""},{"old":"/api/v1/farms/:id/recommendations","type":0,"val":"farms","end":""},{"old":"/api/v1/farms/:id/recommendations","type":1,"val":"id","end":""},{"old":"/api/v1/farms/:id/recommendations","type":0,"val":"recommendations","end":""}],
    types: placeholder as Registry['recommendations.store']['types'],
  },
  'recommendations.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/farms/:id/recommendations/:runId',
    tokens: [{"old":"/api/v1/farms/:id/recommendations/:runId","type":0,"val":"api","end":""},{"old":"/api/v1/farms/:id/recommendations/:runId","type":0,"val":"v1","end":""},{"old":"/api/v1/farms/:id/recommendations/:runId","type":0,"val":"farms","end":""},{"old":"/api/v1/farms/:id/recommendations/:runId","type":1,"val":"id","end":""},{"old":"/api/v1/farms/:id/recommendations/:runId","type":0,"val":"recommendations","end":""},{"old":"/api/v1/farms/:id/recommendations/:runId","type":1,"val":"runId","end":""}],
    types: placeholder as Registry['recommendations.show']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
