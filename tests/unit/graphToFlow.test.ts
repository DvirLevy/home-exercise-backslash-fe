import { graphToFlow } from '@/features/visualization/utils/graphToFlow'
import { graph, node } from '../msw/fixtures'

describe('graphToFlow', () => {
  it('creates one custom node per graph node, with the node as data', () => {
    const g = graph()
    const { nodes } = graphToFlow(g)
    expect(nodes.map((n) => n.id)).toEqual(['frontend', 'orders', 'db'])
    expect(nodes.every((n) => n.type === 'graph')).toBe(true)
    expect(nodes[0]!.data).toMatchObject({
      node: g.nodes[0],
      roles: [],
      matchedFilters: [],
      dimmed: false,
    })
  })

  it('creates directed edges with arrowheads, in file order', () => {
    const { edges } = graphToFlow(graph())
    expect(edges.map((e) => [e.source, e.target])).toEqual([
      ['frontend', 'orders'],
      ['orders', 'db'],
    ])
    expect(edges.every((e) => e.markerEnd && typeof e.markerEnd === 'object')).toBe(true)
  })

  it('keeps parallel edges apart with distinct ids', () => {
    const { edges } = graphToFlow(
      graph({
        edges: [
          { from: 'frontend', to: 'orders' },
          { from: 'frontend', to: 'orders', extra: { protocol: 'grpc' } },
        ],
      }),
    )
    expect(new Set(edges.map((e) => e.id)).size).toBe(2)
  })

  it('drops edges whose endpoints are not nodes', () => {
    const { edges } = graphToFlow(graph({ edges: [{ from: 'frontend', to: 'nowhere' }] }))
    expect(edges).toEqual([])
  })

  it('positions nodes left to right along the edges', () => {
    const { nodes } = graphToFlow(graph())
    const x = Object.fromEntries(nodes.map((n) => [n.id, n.position.x]))
    expect(x.frontend).toBeLessThan(x.orders!)
    expect(x.orders).toBeLessThan(x.db!)
  })

  it('labels placeholders for assistive technology', () => {
    const { nodes } = graphToFlow(
      graph({ nodes: [node('ghost', { placeholder: true, kind: null }), node('a')], edges: [] }),
    )
    expect(nodes[0]!.ariaLabel).toBe('ghost, placeholder')
    expect(nodes[1]!.ariaLabel).toBe('a, service')
  })
})
