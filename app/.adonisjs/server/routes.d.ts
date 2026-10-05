import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'planner': { paramsTuple?: []; params?: {} }
    'sources': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'farms': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'farms.index': { paramsTuple?: []; params?: {} }
    'farms.store': { paramsTuple?: []; params?: {} }
    'farms.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'farms.inputs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'farms.preferences': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'farms.soil': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'farms.history': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'farms.crops': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'environment.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'environment.refresh': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recommendations.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recommendations.show': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'runId': ParamValue} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'planner': { paramsTuple?: []; params?: {} }
    'sources': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'farms': { paramsTuple?: []; params?: {} }
    'farms.index': { paramsTuple?: []; params?: {} }
    'farms.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'farms.inputs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'farms.crops': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'environment.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recommendations.show': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'runId': ParamValue} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'planner': { paramsTuple?: []; params?: {} }
    'sources': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'farms': { paramsTuple?: []; params?: {} }
    'farms.index': { paramsTuple?: []; params?: {} }
    'farms.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'farms.inputs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'farms.crops': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'environment.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recommendations.show': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'runId': ParamValue} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'farms.store': { paramsTuple?: []; params?: {} }
    'environment.refresh': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recommendations.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'farms.preferences': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'farms.soil': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'farms.history': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}