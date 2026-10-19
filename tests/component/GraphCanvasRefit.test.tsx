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

const view = (mode: 'highlight' | 'routeOnly', selected: string | null = null) => (
  <div style={{ width: 1000, height: 700 }}>
    <GraphCanvas graph={full} route={route} mode={mode} selected={selected} onSelect={vi.fn()} />
  </div>
)

describe('GraphCanvas refit', () => {
  beforeEach(() => fitView.mockClear())

  it('fits the view again when the set of drawn nodes changes (Route only)', () => {
    const { rerender } = render(view('highlight'))
    expect(fitView).not.toHaveBeenCalled() // the initial fit is done by <ReactFlow fitView>

    rerender(view('routeOnly'))

    expect(fitView).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('node-d')).not.toBeInTheDocument()

    rerender(view('highlight'))
    expect(fitView).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('node-d')).toBeInTheDocument()
  })

  it('does not move the view for changes that keep the same nodes, like selecting one', () => {
    const { rerender } = render(view('highlight'))
    rerender(view('highlight', 'b'))
    rerender(view('highlight', 'c'))
    expect(fitView).not.toHaveBeenCalled()
  })
})
