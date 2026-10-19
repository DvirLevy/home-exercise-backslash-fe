import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { Role } from '@/types/api'
import type { RouteQuery } from '@/types/ui'
import { addFilter, parseRouteQuery, removeFilter, writeRouteQuery } from '../utils/routeQuery'

/** The route query lives in the URL (`?start=public&through=vulnerable&end=sink`) so it can be shared. */
export function useRouteQuery() {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => parseRouteQuery(params), [params])

  const update = useCallback(
    (change: (current: RouteQuery) => RouteQuery) =>
      setParams((current) => writeRouteQuery(current, change(parseRouteQuery(current))), {
        replace: true,
      }),
    [setParams],
  )

  return {
    query,
    add: (role: Role, key: string) => update((q) => addFilter(q, role, key)),
    remove: (role: Role, key: string) => update((q) => removeFilter(q, role, key)),
    clear: () => update(() => ({ start: [], through: [], end: [] })),
  }
}
