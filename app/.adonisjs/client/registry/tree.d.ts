/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
  planner: typeof routes['planner']
  sources: typeof routes['sources']
  catalog: {
    index: typeof routes['catalog.index']
  }
  farmerAnalysis: {
    analyze: typeof routes['farmer_analysis.analyze']
  }
  location: {
    reverse: typeof routes['location.reverse']
    show: typeof routes['location.show']
    update: typeof routes['location.update']
  }
  newAccount: {
    create: typeof routes['new_account.create']
    store: typeof routes['new_account.store']
  }
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  farms: typeof routes['farms'] & {
    index: typeof routes['farms.index']
    store: typeof routes['farms.store']
    show: typeof routes['farms.show']
    inputs: typeof routes['farms.inputs']
    preferences: typeof routes['farms.preferences']
    soil: typeof routes['farms.soil']
    history: typeof routes['farms.history']
    crops: typeof routes['farms.crops']
  }
  environment: {
    show: typeof routes['environment.show']
    refresh: typeof routes['environment.refresh']
  }
  recommendations: {
    store: typeof routes['recommendations.store']
    show: typeof routes['recommendations.show']
  }
}
