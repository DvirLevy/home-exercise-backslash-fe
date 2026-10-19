import { SearchX } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { buttonVariants } from '@/design-system/ui/button'
import { Skeleton } from '@/design-system/ui/skeleton'
import { useGraph } from '@/features/graph/hooks/useGraph'
import { GraphCanvas } from '@/features/visualization/components/GraphCanvas'
import { NodeDetails } from '@/features/visualization/components/NodeDetails'
import { normalizeError } from '@/services/errors'
import { cn } from '@/utils/cn'

export function GraphPage() {
  const { id = '' } = useParams()
  const { data: graph, error, isPending } = useGraph(id)
  // Selection is local UI state; it resets when another graph is opened.
  const [selection, setSelection] = useState<{ graphId: string; name: string } | null>(null)

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

  const selectedName = selection?.graphId === id ? selection.name : null
  const selectedNode = graph.nodes.find((n) => n.name === selectedName) ?? null

  return (
    <div className="flex h-full min-h-0">
      <div className="min-w-0 flex-1" data-testid="canvas">
        <GraphCanvas
          graph={graph}
          selected={selectedNode?.name ?? null}
          onSelect={(name) => setSelection(name ? { graphId: id, name } : null)}
        />
      </div>
      <aside
        className="bg-card w-[340px] shrink-0 overflow-auto border-l p-3.5"
        aria-label="Details panel"
      >
        {selectedNode ? (
          <NodeDetails node={selectedNode} onClose={() => setSelection(null)} />
        ) : (
          <p className="text-muted-foreground text-[13px]">Select a node to see its details.</p>
        )}
      </aside>
    </div>
  )
}
