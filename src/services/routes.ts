import type { RouteResult } from '@/types/api'
import type { RouteQuery } from '@/types/ui'
import { apiClient } from './apiClient'
import { routeResultSchema } from './schemas'

export async function getRoutes(graphId: string, query: RouteQuery): Promise<RouteResult> {
  const { data } = await apiClient.get(`/api/v1/graphs/${encodeURIComponent(graphId)}/routes`, {
    params: { start: query.start, through: query.through, end: query.end },
  })
  return routeResultSchema.parse(data)
}
