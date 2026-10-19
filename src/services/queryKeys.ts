import type { RouteQuery } from '@/types/ui'

const sorted = (values: string[]) => [...values].sort()

export const queryKeys = {
  health: ['health'] as const,
  graphs: ['graphs'] as const,
  graph: (id: string) => ['graph', id] as const,
  filters: (id: string) => ['filters', id] as const,
  routes: (id: string, query: RouteQuery) =>
    [
      'routes',
      id,
      { start: sorted(query.start), through: sorted(query.through), end: sorted(query.end) },
    ] as const,
}
