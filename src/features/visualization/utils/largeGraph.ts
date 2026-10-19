import type { ViewMode } from '@/types/ui'

/** Above this many nodes a graph, or a route result, is not drawn. */
export const LARGE_GRAPH_NODES = 1500

export type CanvasPlan = {
  /** The mode to draw with. */
  mode: ViewMode
  /** True when the user's choice was overridden because the graph is large. */
  forced: boolean
  /** True when there is nothing to draw until the user picks filters. */
  needsQuery: boolean
  /** True when the route result itself has too many nodes to draw: the user must narrow the query. */
  routeTooLarge: boolean
}

export function planCanvas(input: {
  nodeCount: number
  hasQuery: boolean
  requestedMode: ViewMode
  /** Number of nodes in the current route result, once known. */
  routeNodeCount?: number | null
}): CanvasPlan {
  const routeTooLarge = (input.routeNodeCount ?? 0) > LARGE_GRAPH_NODES
  if (input.nodeCount <= LARGE_GRAPH_NODES) {
    return { mode: input.requestedMode, forced: false, needsQuery: false, routeTooLarge }
  }
  return { mode: 'routeOnly', forced: true, needsQuery: !input.hasQuery, routeTooLarge }
}
