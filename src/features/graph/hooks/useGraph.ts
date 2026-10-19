import { useQuery } from '@tanstack/react-query'
import { getGraph } from '@/services/graphs'
import { queryKeys } from '@/services/queryKeys'

export function useGraph(id: string) {
  return useQuery({
    queryKey: queryKeys.graph(id),
    queryFn: () => getGraph(id),
    // A deleted graph will not come back: do not retry a 404.
    retry: (count, error) => !('status' in error && error.status === 404) && count < 2,
  })
}
