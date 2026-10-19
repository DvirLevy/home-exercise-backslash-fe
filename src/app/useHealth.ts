import { useQuery } from '@tanstack/react-query'
import { getHealth } from '@/services/health'
import { queryKeys } from '@/services/queryKeys'

const HEALTH_POLL_MS = 10_000

/** Polls /health; an unreachable API stays in the error state and keeps being retried. */
export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: getHealth,
    refetchInterval: HEALTH_POLL_MS,
    retry: false,
  })
}
