import { Skeleton } from '@/design-system/ui/skeleton'

/** Shown while the graph page chunk is downloading. */
export function GraphPageFallback() {
  return (
    <div className="space-y-3 p-4" aria-label="Loading graph">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}
