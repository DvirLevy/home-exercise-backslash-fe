import { useState } from 'react'
import { Alert } from '@/design-system/ui/alert'
import { NoRouteState } from '@/features/filters/components/NoRouteState'
import { RouteQueryPanel } from '@/features/filters/components/RouteQueryPanel'
import { useFilters } from '@/features/filters/hooks/useFilters'
import { useRouteQuery } from '@/features/filters/hooks/useRouteQuery'
import { useRoutes } from '@/features/filters/hooks/useRoutes'
import { isQueryEmpty } from '@/features/filters/utils/routeQuery'
import { CanvasToolbar } from '@/features/visualization/components/CanvasToolbar'
import { GraphCanvas } from '@/features/visualization/components/GraphCanvas'
import { NodeDetails } from '@/features/visualization/components/NodeDetails'
import { LARGE_GRAPH_NODES, planCanvas } from '@/features/visualization/utils/largeGraph'
import { useDelayedFlag } from '@/hooks/useDelayedFlag'
import { normalizeError } from '@/services/errors'
import type { GraphDetail } from '@/types/api'
import type { ViewMode } from '@/types/ui'
import { pluralize } from '@/utils/format'

/** An open graph: the canvas in the middle, the route query and node details on the right. */
export function GraphWorkspace({ graph }: { graph: GraphDetail }) {
  const { query, add, remove, clear } = useRouteQuery()
  const hasQuery = !isQueryEmpty(query)
  const [requestedMode, setRequestedMode] = useState<ViewMode>('highlight')
  const [selected, setSelected] = useState<string | null>(null)

  const filters = useFilters(graph.id)
  const routes = useRoutes(graph.id, query, graph.version)
  const routeError = hasQuery && routes.isError ? normalizeError(routes.error) : null
  // A stale result must never outlive its query (the previous result is kept only while loading).
  const route = hasQuery && !routes.isError ? (routes.data ?? null) : null
  const updating = useDelayedFlag(hasQuery && routes.isFetching)

  const plan = planCanvas({
    nodeCount: graph.nodes.length,
    hasQuery,
    requestedMode,
    routeNodeCount: route?.nodes.length,
  })
  const noRoute = route !== null && route.nodes.length === 0
  const selectedNode = graph.nodes.find((n) => n.name === selected) ?? null
  const matched = route?.nodes.find((n) => n.name === selected)?.matched

  let canvas: React.ReactNode
  if (plan.needsQuery) {
    canvas = (
      <div className="p-4">
        <Alert variant="warning">
          <b>{pluralize(graph.nodes.length, 'node')}.</b> This graph is too large to draw whole
          (over {LARGE_GRAPH_NODES.toLocaleString('en')} nodes). Choose filters in the route query
          to see the routes you care about.
        </Alert>
      </div>
    )
  } else if (plan.routeTooLarge && route) {
    canvas = (
      <div className="p-4">
        <Alert variant="warning">
          <b>This route is too large to draw.</b> It has {pluralize(route.nodes.length, 'node')} and{' '}
          {pluralize(route.edges.length, 'edge')}; routes over{' '}
          {LARGE_GRAPH_NODES.toLocaleString('en')} nodes are not drawn. Narrow the query: add a
          filter to <i>Start at</i>, <i>Pass through</i> or <i>End at</i>, or replace a broad one
          with a more specific one.
        </Alert>
      </div>
    )
  } else if (plan.forced && route === null) {
    canvas = (
      <div className="p-4">
        {routeError ? (
          <Alert variant="warning">The route could not be loaded, so nothing can be drawn.</Alert>
        ) : (
          <p className="text-muted-foreground" role="status">
            Loading the route…
          </p>
        )}
      </div>
    )
  } else {
    canvas = (
      <GraphCanvas
        graph={graph}
        route={route}
        mode={plan.mode}
        selected={selected}
        onSelect={setSelected}
        toolbar={
          <CanvasToolbar
            mode={plan.mode}
            onModeChange={setRequestedMode}
            highlightDisabled={plan.forced}
            summary={route ? { nodes: route.nodes.length, edges: route.edges.length } : null}
            updating={updating}
          />
        }
        overlay={noRoute ? <NoRouteState query={query} onClear={clear} /> : null}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-col min-[1100px]:h-full min-[1100px]:flex-row">
      <div
        className="@container h-[65vh] min-h-[360px] min-w-0 min-[1100px]:h-auto min-[1100px]:flex-1"
        data-testid="canvas"
      >
        {canvas}
      </div>
      <aside
        className="bg-card w-full shrink-0 border-t p-3.5 min-[1100px]:w-[340px] min-[1100px]:overflow-auto min-[1100px]:border-t-0 min-[1100px]:border-l"
        aria-label="Details panel"
      >
        <RouteQueryPanel
          query={query}
          filters={filters.data}
          filtersLoading={filters.isPending}
          filtersError={filters.error ? normalizeError(filters.error) : null}
          routeError={routeError}
          onAdd={add}
          onRemove={remove}
          onClear={clear}
        />
        <div className="mt-3.5">
          {selectedNode ? (
            <NodeDetails node={selectedNode} matched={matched} onClose={() => setSelected(null)} />
          ) : (
            <p className="text-muted-foreground text-[13px]">Select a node to see its details.</p>
          )}
        </div>
      </aside>
    </div>
  )
}
