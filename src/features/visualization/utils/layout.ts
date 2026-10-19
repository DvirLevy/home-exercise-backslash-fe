import dagre from '@dagrejs/dagre'

export const NODE_WIDTH = 176
export const NODE_HEIGHT = 84

export type LayoutInput = {
  nodes: string[]
  edges: { from: string; to: string }[]
}

export type Position = { x: number; y: number }

/**
 * Left-to-right layered layout. Returns the top-left corner of every node (React Flow's
 * convention); dagre itself reports centres. Edges that touch an unknown node are ignored.
 */
export function computeLayout({ nodes, edges }: LayoutInput): Map<string, Position> {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 28, ranksep: 90, marginx: 20, marginy: 20 })
  g.setDefaultEdgeLabel(() => ({}))

  const known = new Set(nodes)
  for (const name of nodes) g.setNode(name, { width: NODE_WIDTH, height: NODE_HEIGHT })
  for (const e of edges) if (known.has(e.from) && known.has(e.to)) g.setEdge(e.from, e.to)

  dagre.layout(g)

  const positions = new Map<string, Position>()
  for (const name of nodes) {
    const n = g.node(name)
    positions.set(name, { x: n.x - NODE_WIDTH / 2, y: n.y - NODE_HEIGHT / 2 })
  }
  return positions
}
