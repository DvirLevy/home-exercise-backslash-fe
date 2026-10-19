import { render, screen } from '@testing-library/react'
import { GraphCanvas } from '@/features/visualization/components/GraphCanvas'
import type { RouteResult } from '@/types/api'
import { graph, node } from '../msw/fixtures'

const fitView = vi.fn()

vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>()
  return { ...actual, useReactFlow: () => ({ ...actual.useReactFlow(), fitView }) }
})

const full = graph({
  nodes: [node('a'), node('b'), node('c'), node('d')],
  edges: [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
    { from: 'c', to: 'd' },
  ],
})
const route: RouteResult = {
  graphId: 'g1',
  version: 1,
  applied: { start: ['x'], through: [], end: [] },
  nodes: [{ ...full.nodes[0]!, matched: { roles: ['start'], filters: ['x'] } }],
  edges: [],
}

type Mode = 'highlight' | 'routeOnly'

const view = (opts: { route?: RouteResult | null; mode?: Mode; selected?: string | null } = {}) => (
  <div style={{ width: 1000, height: 700 }}>
    <GraphCanvas
      graph={full}
      route={opts.route ?? null}
      mode={opts.mode ?? 'highlight'}
      selected={opts.selected ?? null}
      onSelect={vi.fn()}
    />
  </div>
)

describe('GraphCanvas view focus', () => {
  beforeEach(() => fitView.mockClear())

  it('leaves the initial fit to <ReactFlow> when there is no route', () => {
    render(view())
    expect(fitView).not.toHaveBeenCalled()
  })

  it('focuses on the route nodes when a route is applied, keeping the rest of the graph drawn', () => {
    const { rerender } = render(view())
    rerender(view({ route }))

    expect(fitView).toHaveBeenCalledTimes(1)
    expect(fitView).toHaveBeenLastCalledWith(expect.objectContaining({ nodes: [{ id: 'a' }] }))
    for (const name of ['a', 'b', 'c', 'd'])
      expect(screen.getByTestId(`node-${name}`)).toBeInTheDocument()
  })

  it('focuses on the route when it is already there at the start (e.g. a shared URL)', () => {
    render(view({ route }))
    expect(fitView).toHaveBeenCalledTimes(1)
    expect(fitView).toHaveBeenLastCalledWith(expect.objectContaining({ nodes: [{ id: 'a' }] }))
  })

  it('fits the whole drawing again when the route is cleared', () => {
    const { rerender } = render(view({ route }))
    fitView.mockClear()

    rerender(view())

    expect(fitView).toHaveBeenCalledTimes(1)
    expect(fitView.mock.lastCall![0].nodes).toBeUndefined()
  })

  it('refits when switching to Route only, which changes the drawn nodes', () => {
    const { rerender } = render(view({ route }))
    fitView.mockClear()

    rerender(view({ route, mode: 'routeOnly' }))

    expect(fitView).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('node-d')).not.toBeInTheDocument()
  })

  it('does not move the view when the same route is refetched, or a node is selected', () => {
    const { rerender } = render(view({ route }))
    fitView.mockClear()

    rerender(view({ route: { ...route, nodes: [...route.nodes] } })) // new object, same nodes
    rerender(view({ route, selected: 'b' }))
    rerender(view({ route, selected: 'c' }))

    expect(fitView).not.toHaveBeenCalled()
  })
})
