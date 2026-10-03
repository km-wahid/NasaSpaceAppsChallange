/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'catalog.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/catalog'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/catalog_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/catalog_controller').default['index']>>>
    }
  }
  'farmer_analysis.analyze': {
    methods: ["POST"]
    pattern: '/api/v1/crop-rotation/analyze'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/farmer_analysis_controller').default['analyze']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/farmer_analysis_controller').default['analyze']>>>
    }
  }
  'location.reverse': {
    methods: ["POST"]
    pattern: '/api/v1/location/reverse'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/location_controller').default['reverse']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/location_controller').default['reverse']>>>
    }
  }
  'new_account.create': {
    methods: ["GET","HEAD"]
    pattern: '/signup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['create']>>>
    }
  }
  'new_account.store': {
    methods: ["POST"]
    pattern: '/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'session.create': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
    }
  }
  'session.destroy': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
    }
  }
  'location.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/location'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/location_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/location_controller').default['show']>>>
    }
  }
  'location.update': {
    methods: ["PUT"]
    pattern: '/api/v1/location'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/location_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/location_controller').default['update']>>>
    }
  }
  'farms.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/farms'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['index']>>>
    }
  }
  'farms.store': {
    methods: ["POST"]
    pattern: '/api/v1/farms'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['store']>>>
    }
  }
  'farms.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/farms/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['show']>>>
    }
  }
  'farms.inputs': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/farms/:id/inputs'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['inputs']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['inputs']>>>
    }
  }
  'farms.preferences': {
    methods: ["PUT"]
    pattern: '/api/v1/farms/:id/preferences'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['preferences']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['preferences']>>>
    }
  }
  'farms.soil': {
    methods: ["PUT"]
    pattern: '/api/v1/farms/:id/soil'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['soil']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['soil']>>>
    }
  }
  'farms.history': {
    methods: ["PUT"]
    pattern: '/api/v1/farms/:id/history'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['history']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['history']>>>
    }
  }
  'farms.crops': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/farms/:id/crops'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['crops']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/farms_controller').default['crops']>>>
    }
  }
  'environment.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/farms/:id/environment'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/environment_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/environment_controller').default['show']>>>
    }
  }
  'environment.refresh': {
    methods: ["POST"]
    pattern: '/api/v1/farms/:id/environment/refresh'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/environment_controller').default['refresh']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/environment_controller').default['refresh']>>>
    }
  }
  'recommendations.store': {
    methods: ["POST"]
    pattern: '/api/v1/farms/:id/recommendations'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/recommendations_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/recommendations_controller').default['store']>>>
    }
  }
  'recommendations.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/farms/:id/recommendations/:runId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; runId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/recommendations_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/recommendations_controller').default['show']>>>
    }
  }
}
