import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/queryKeys'
import { getRoutes } from '@/services/routes'
import type { RouteQuery } from '@/types/ui'
import { isQueryEmpty } from '../utils/routeQuery'

/** Runs the route query; with no filter at all there is nothing to ask (the whole graph is already loaded). */
export function useRoutes(graphId: string, query: RouteQuery, graphVersion: number) {
  return useQuery({
    // The version is part of the key so a replaced graph never shows the old result.
    queryKey: [...queryKeys.routes(graphId, query), graphVersion],
    queryFn: () => getRoutes(graphId, query),
    enabled: !isQueryEmpty(query),
    placeholderData: keepPreviousData,
    retry: (count, error) => {
      const status = 'status' in error ? error.status : null
      return typeof status === 'number' && status >= 400 && status < 500 ? false : count < 1
    },
  })
}
