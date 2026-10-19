import { SearchX } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { buttonVariants } from '@/design-system/ui/button'
import { Skeleton } from '@/design-system/ui/skeleton'
import { useGraph } from '@/features/graph/hooks/useGraph'
import { normalizeError } from '@/services/errors'
import { cn } from '@/utils/cn'
import { pluralize } from '@/utils/format'

export function GraphPage() {
  const { id = '' } = useParams()
  const { data: graph, error, isPending } = useGraph(id)

  if (error) {
    const apiError = normalizeError(error)
    if (apiError.status === 404 || apiError.status === 400) {
      return (
        <EmptyState
          icon={<SearchX className="size-5" aria-hidden />}
          title="Graph not found"
          action={
            <Link to="/" className={cn(buttonVariants())}>
              Back to the graphs
            </Link>
          }
        >
          It may have been deleted elsewhere.
        </EmptyState>
      )
    }
    return (
      <div className="p-4">
        <ErrorAlert title="Could not load the graph" message={apiError.message} />
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="space-y-3 p-4" aria-label="Loading graph">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  // The canvas and the route query panel arrive in the next tasks.
  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold">{graph.name}</h1>
      <p className="text-muted-foreground">
        {pluralize(graph.nodes.length, 'node')} · {pluralize(graph.edges.length, 'edge')}
      </p>
    </div>
  )
}
