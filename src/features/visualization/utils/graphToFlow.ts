import { MarkerType, type Edge, type Node } from '@xyflow/react'
import type { GraphDetail, GraphNode, Role } from '@/types/api'
import { computeLayout, NODE_HEIGHT, NODE_WIDTH } from './layout'

/** What the custom node component receives as `data`. */
export type GraphNodeData = {
  node: GraphNode
  /** Roles the node plays on a matching route (task 3); empty when no route query is applied. */
  roles: Role[]
  /** Query filters the node matches (task 3). */
  matchedFilters: string[]
  /** True when a route is highlighted and this node is not on it. */
  dimmed: boolean
  [key: string]: unknown
}

export type FlowNode = Node<GraphNodeData, 'graph'>
export type FlowEdge = Edge

export type FlowModel = { nodes: FlowNode[]; edges: FlowEdge[] }

export const EDGE_COLOR = 'var(--placeholder)'

export function edgeId(from: string, to: string, index: number) {
  return `${from}->${to}#${index}`
}

/** Pure conversion of a graph into React Flow nodes and edges, laid out left to right. */
export function graphToFlow(graph: Pick<GraphDetail, 'nodes' | 'edges'>): FlowModel {
  const positions = computeLayout({
    nodes: graph.nodes.map((n) => n.name),
    edges: graph.edges,
  })
  const names = new Set(graph.nodes.map((n) => n.name))

  const nodes: FlowNode[] = graph.nodes.map((node) => ({
    id: node.name,
    type: 'graph',
    position: positions.get(node.name) ?? { x: 0, y: 0 },
    // Lets React Flow place and draw the node on the first paint, before it has measured the DOM.
    initialWidth: NODE_WIDTH,
    initialHeight: NODE_HEIGHT,
    data: { node, roles: [], matchedFilters: [], dimmed: false },
    ariaLabel: node.placeholder
      ? `${node.name}, placeholder`
      : `${node.name}, ${node.kind ?? 'unknown kind'}`,
  }))

  const edges: FlowEdge[] = graph.edges
    .map((e, index) => ({ e, index }))
    .filter(({ e }) => names.has(e.from) && names.has(e.to))
    .map(({ e, index }) => ({
      id: edgeId(e.from, e.to, index),
      source: e.from,
      target: e.to,
      style: { stroke: EDGE_COLOR, strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR, width: 16, height: 16 },
    }))

  return { nodes, edges }
}
