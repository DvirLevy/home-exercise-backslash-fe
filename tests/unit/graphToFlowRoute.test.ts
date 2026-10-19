import { graphToFlow } from '@/features/visualization/utils/graphToFlow'
import type { RouteResult } from '@/types/api'
import { graph, node } from '../msw/fixtures'

// frontend → orders → db, plus an unrelated branch admin → queue
const g = graph({
  nodes: [
    node('frontend', { publicExposed: true }),
    node('orders'),
    node('db', { kind: 'rds' }),
    node('admin'),
    node('queue', { kind: 'sqs' }),
  ],
  edges: [
    { from: 'frontend', to: 'orders' },
    { from: 'orders', to: 'db' },
    { from: 'admin', to: 'queue' },
  ],
})

const route: RouteResult = {
  graphId: 'g1',
  version: 1,
  applied: { start: ['public'], through: [], end: ['sink'] },
  nodes: [
    { ...g.nodes[0]!, matched: { roles: ['start'], filters: ['public'] } },
    { ...g.nodes[1]!, matched: { roles: [], filters: [] } },
    { ...g.nodes[2]!, matched: { roles: ['end'], filters: ['sink'] } },
  ],
  edges: [
    { from: 'frontend', to: 'orders' },
    { from: 'orders', to: 'db' },
  ],
}

const byId = (nodes: ReturnType<typeof graphToFlow>['nodes']) =>
  Object.fromEntries(nodes.map((n) => [n.id, n]))

describe('graphToFlow with a route', () => {
  it('highlight: keeps the whole graph and dims what is off the route', () => {
    const { nodes, edges } = graphToFlow(g, { route, mode: 'highlight' })
    expect(nodes).toHaveLength(5)
    const n = byId(nodes)
    expect(n.frontend!.data.dimmed).toBe(false)
    expect(n.orders!.data.dimmed).toBe(false)
    expect(n.admin!.data.dimmed).toBe(true)
    expect(n.queue!.data.dimmed).toBe(true)
    expect(edges).toHaveLength(3)
  })

  it('highlight: carries the matched roles and filters into the node data', () => {
    const n = byId(graphToFlow(g, { route }).nodes)
    expect(n.frontend!.data).toMatchObject({ roles: ['start'], matchedFilters: ['public'] })
    expect(n.db!.data).toMatchObject({ roles: ['end'], matchedFilters: ['sink'] })
    expect(n.admin!.data).toMatchObject({ roles: [], matchedFilters: [] })
  })

  it('highlight: emphasizes route edges and dims the others', () => {
    const { edges } = graphToFlow(g, { route })
    const style = (from: string) => edges.find((e) => e.source === from)!.style!
    expect(style('frontend')).toMatchObject({
      stroke: 'var(--primary)',
      strokeWidth: 2.5,
      opacity: 1,
    })
    expect(style('admin')).toMatchObject({ stroke: 'var(--placeholder)', opacity: 'var(--dimmed)' })
  })

  it('route only: draws just the route nodes and edges', () => {
    const { nodes, edges } = graphToFlow(g, { route, mode: 'routeOnly' })
    expect(nodes.map((n) => n.id)).toEqual(['frontend', 'orders', 'db'])
    expect(edges.map((e) => [e.source, e.target])).toEqual([
      ['frontend', 'orders'],
      ['orders', 'db'],
    ])
    expect(nodes.every((n) => !n.data.dimmed)).toBe(true)
  })

  it('route only: lays the subset out on its own', () => {
    const x = byId(graphToFlow(g, { route, mode: 'routeOnly' }).nodes)
    expect(x.frontend!.position.x).toBeLessThan(x.orders!.position.x)
    expect(x.orders!.position.x).toBeLessThan(x.db!.position.x)
  })

  it('without a route, or with an empty one, shows the plain graph in both modes', () => {
    const empty: RouteResult = { ...route, nodes: [], edges: [] }
    for (const options of [
      {},
      { route: null },
      { route: empty },
      { route: empty, mode: 'routeOnly' as const },
    ]) {
      const { nodes, edges } = graphToFlow(g, options)
      expect(nodes).toHaveLength(5)
      expect(nodes.every((n) => !n.data.dimmed)).toBe(true)
      expect(
        edges.every((e) => e.style?.opacity === 1 && e.style.stroke === 'var(--placeholder)'),
      ).toBe(true)
    }
  })

  it('treats parallel edges between route nodes as route edges', () => {
    const parallel = {
      ...g,
      edges: [...g.edges, { from: 'frontend', to: 'orders', extra: { via: 'grpc' } }],
    }
    const { edges } = graphToFlow(parallel, { route })
    expect(
      edges.filter((e) => e.source === 'frontend' && e.style?.strokeWidth === 2.5),
    ).toHaveLength(2)
  })
})
