import { useQuery } from '@tanstack/react-query'
import { listFilters } from '@/services/filters'
import { queryKeys } from '@/services/queryKeys'

export function useFilters(graphId: string) {
  return useQuery({
    queryKey: queryKeys.filters(graphId),
    queryFn: () => listFilters(graphId),
  })
}
