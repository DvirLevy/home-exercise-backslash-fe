import { z } from 'zod'
import type { Filter } from '@/types/api'
import { apiClient } from './apiClient'
import { filterSchema } from './schemas'

/** Filters are read-only in this app: they are only listed and then chosen in the route query. */
export async function listFilters(graphId: string): Promise<Filter[]> {
  const { data } = await apiClient.get(`/api/v1/graphs/${encodeURIComponent(graphId)}/filters`)
  return z.array(filterSchema).parse(data)
}
