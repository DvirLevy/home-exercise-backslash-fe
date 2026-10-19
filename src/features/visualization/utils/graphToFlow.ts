import { MarkerType, type Edge, type Node } from '@xyflow/react'
import type { GraphDetail, GraphNode, Role, RouteResult } from '@/types/api'
import type { ViewMode } from '@/types/ui'
import { computeLayout, NODE_HEIGHT, NODE_WIDTH } from './layout'

/** What the custom node component receives as `data`. */
export type GraphNodeData = {
  node: GraphNode
  /** Roles the node plays on a matching route; empty when no route query is applied. */
  roles: Role[]
  /** Query filters the node matches. */
  matchedFilters: string[]
  /** True when a route is highlighted and this node is not on it. */
  dimmed: boolean
  [key: string]: unknown
}

export type FlowNode = Node<GraphNodeData, 'graph'>
export type FlowEdge = Edge

export type FlowModel = { nodes: FlowNode[]; edges: FlowEdge[] }

export const EDGE_COLOR = 'var(--placeholder)'
export const ROUTE_EDGE_COLOR = 'var(--primary)'

export function edgeId(from: string, to: string, index: number) {
  return `${from}->${to}#${index}`
}

const pairKey = (from: string, to: string) => `${from}\u0000${to}`

export type FlowOptions = {
  /** The result of a route query, if one is applied. */
  route?: RouteResult | null
  mode?: ViewMode
}

function edgeStyle(
  state: 'plain' | 'route' | 'dimmed',
): Pick<FlowEdge, 'style' | 'markerEnd' | 'zIndex'> {
  const color = state === 'route' ? ROUTE_EDGE_COLOR : EDGE_COLOR
  return {
    style: {
      stroke: color,
      strokeWidth: state === 'route' ? 2.5 : 1.5,
      opacity: state === 'dimmed' ? 'var(--dimmed)' : 1,
    },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
    zIndex: state === 'route' ? 1 : 0,
  }
}

/**
 * Pure conversion of a graph into React Flow nodes and edges, laid out left to right.
 *
 * - No route (or a route with no result): the whole graph, nothing dimmed.
 * - `highlight`: the whole graph; everything off the route is dimmed, route edges are emphasized.
 * - `routeOnly`: only the nodes and edges of the route, laid out on their own.
 */
export function graphToFlow(
  graph: Pick<GraphDetail, 'nodes' | 'edges'>,
  { route = null, mode = 'highlight' }: FlowOptions = {},
): FlowModel {
  const hasRoute = route !== null && route.nodes.length > 0
  const matched = new Map((route?.nodes ?? []).map((n) => [n.name, n.matched]))
  const routePairs = new Set((route?.edges ?? []).map((e) => pairKey(e.from, e.to)))

  const sourceNodes: GraphNode[] =
    hasRoute && mode === 'routeOnly' ? graph.nodes.filter((n) => matched.has(n.name)) : graph.nodes
  const names = new Set(sourceNodes.map((n) => n.name))
  const sourceEdges = graph.edges
    .map((e, index) => ({ e, index }))
    .filter(({ e }) => names.has(e.from) && names.has(e.to))
    .filter(({ e }) => !(hasRoute && mode === 'routeOnly') || routePairs.has(pairKey(e.from, e.to)))

  const positions = computeLayout({
    nodes: sourceNodes.map((n) => n.name),
    edges: sourceEdges.map(({ e }) => e),
  })

  const nodes: FlowNode[] = sourceNodes.map((node) => {
    const m = matched.get(node.name)
    return {
      id: node.name,
      type: 'graph',
      position: positions.get(node.name) ?? { x: 0, y: 0 },
      // Lets React Flow place and draw the node on the first paint, before it has measured the DOM.
      initialWidth: NODE_WIDTH,
      initialHeight: NODE_HEIGHT,
      ariaLabel: node.placeholder
        ? `${node.name}, placeholder`
        : `${node.name}, ${node.kind ?? 'unknown kind'}`,
      data: {
        node,
        roles: m?.roles ?? [],
        matchedFilters: m?.filters ?? [],
        dimmed: hasRoute && !m,
      },
    }
  })

  const edges: FlowEdge[] = sourceEdges.map(({ e, index }) => {
    const onRoute = hasRoute && routePairs.has(pairKey(e.from, e.to))
    return {
      id: edgeId(e.from, e.to, index),
      source: e.from,
      target: e.to,
      ...edgeStyle(!hasRoute ? 'plain' : onRoute ? 'route' : 'dimmed'),
    }
  })

  return { nodes, edges }
}
