import { useQuery } from '@tanstack/react-query'
import { listGraphs } from '@/services/graphs'
import { queryKeys } from '@/services/queryKeys'

export function useGraphs() {
  return useQuery({ queryKey: queryKeys.graphs, queryFn: listGraphs })
}
