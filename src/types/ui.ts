import type { Role } from './api'

export type ViewMode = 'highlight' | 'routeOnly'

export type RouteQuery = Record<Role, string[]>
