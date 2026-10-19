import type { Role } from '@/types/api'
import type { RouteQuery } from '@/types/ui'
import { ROLES } from './roles'

export const EMPTY_QUERY: RouteQuery = { start: [], through: [], end: [] }

/** Reads `?start=a&start=b&through=c&end=d`; repeated values are kept once, other params are ignored. */
export function parseRouteQuery(params: URLSearchParams): RouteQuery {
  const query: RouteQuery = { start: [], through: [], end: [] }
  for (const role of ROLES) {
    const values = params
      .getAll(role)
      .flatMap((v) => v.split(','))
      .map((v) => v.trim())
      .filter(Boolean)
    query[role] = [...new Set(values)]
  }
  return query
}

/** Writes the query into a copy of `params`, leaving unrelated params alone. */
export function writeRouteQuery(params: URLSearchParams, query: RouteQuery): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const role of ROLES) next.delete(role)
  for (const role of ROLES) for (const key of query[role]) next.append(role, key)
  return next
}

export function isQueryEmpty(query: RouteQuery): boolean {
  return ROLES.every((role) => query[role].length === 0)
}

export function addFilter(query: RouteQuery, role: Role, key: string): RouteQuery {
  return query[role].includes(key) ? query : { ...query, [role]: [...query[role], key] }
}

export function removeFilter(query: RouteQuery, role: Role, key: string): RouteQuery {
  return { ...query, [role]: query[role].filter((k) => k !== key) }
}
