import { fireEvent, render, screen, within } from '@testing-library/react'
import { GraphCanvas, MINIMAP_MIN_NODES } from '@/features/visualization/components/GraphCanvas'
import { graph, node } from '../msw/fixtures'

const rich = graph({
  nodes: [
    node('frontend', { publicExposed: true }),
    node('orders', {
      vulnerabilities: [
        { severity: 'medium', message: 'm' },
        { severity: 'HIGH', message: 'h' },
      ],
    }),
    node('db', { kind: 'rds', language: null, metadata: { engine: 'postgres' } }),
    node('ghost', {
      kind: null,
      language: null,
      path: null,
      publicExposed: null,
      placeholder: true,
    }),
  ],
  edges: [
    { from: 'frontend', to: 'orders' },
    { from: 'orders', to: 'db' },
    { from: 'orders', to: 'ghost' },
  ],
})

function renderCanvas(g = rich, selected: string | null = null, onSelect = vi.fn()) {
  render(
    <div style={{ width: 1000, height: 700 }}>
      <GraphCanvas graph={g} selected={selected} onSelect={onSelect} />
    </div>,
  )
  return onSelect
}

describe('GraphCanvas', () => {
  it('draws one card per node with its name, kind and language', () => {
    renderCanvas()
    for (const name of ['frontend', 'orders', 'db', 'ghost']) {
      expect(screen.getByTestId(`node-${name}`)).toBeInTheDocument()
    }
    expect(
      within(screen.getByTestId('node-frontend')).getByText('service · java'),
    ).toBeInTheDocument()
    expect(within(screen.getByTestId('node-db')).getByText('rds')).toBeInTheDocument()
  })

  it('shows a Public badge only on public nodes', () => {
    renderCanvas()
    expect(within(screen.getByTestId('node-frontend')).getByText('Public')).toBeInTheDocument()
    expect(within(screen.getByTestId('node-orders')).queryByText('Public')).not.toBeInTheDocument()
  })

  it('shows a vulnerability badge with the count and the highest severity', () => {
    renderCanvas()
    const badge = within(screen.getByTestId('node-orders')).getByText('2 vulns · HIGH')
    expect(badge.style.background).toBe('var(--sev-high)')
    expect(within(screen.getByTestId('node-frontend')).queryByText(/vuln/)).not.toBeInTheDocument()
  })

  it('draws placeholders differently and says they are not defined in the file', () => {
    renderCanvas()
    const ghost = screen.getByTestId('node-ghost')
    expect(ghost).toHaveAttribute('data-placeholder', 'true')
    expect(within(ghost).getByText('placeholder · not defined in the file')).toBeInTheDocument()
    expect(screen.getByTestId('node-orders')).not.toHaveAttribute('data-placeholder')
  })

  it('colours the left border by kind', () => {
    renderCanvas()
    expect(screen.getByTestId('node-db')).toHaveStyle({ borderLeftColor: 'var(--kind-rds)' })
    expect(screen.getByTestId('node-frontend')).toHaveStyle({
      borderLeftColor: 'var(--kind-service)',
    })
  })

  it('reports a click on a node, and a click on the background clears the selection', async () => {
    const onSelect = renderCanvas()
    fireEvent.click(screen.getByTestId('node-orders'))
    expect(onSelect).toHaveBeenCalledWith('orders')

    fireEvent.click(document.querySelector('.react-flow__pane')!)
    expect(onSelect).toHaveBeenLastCalledWith(null)
  })

  it('marks the selected node', () => {
    renderCanvas(rich, 'db')
    expect(document.querySelector('.react-flow__node.selected')).toHaveTextContent('db')
  })

  it('has a legend, zoom controls and a find box', () => {
    renderCanvas()
    expect(screen.getByRole('group', { name: 'Legend' })).toHaveTextContent('Placeholder')
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /fit view/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Find a node' })).toBeInTheDocument()
  })

  it('notes when a graph has no edges', () => {
    renderCanvas(graph({ edges: [] }))
    expect(screen.getByText('This graph has no edges')).toBeInTheDocument()
    expect(screen.getByTestId('node-frontend')).toBeInTheDocument()
  })

  it('shows an empty state for a graph without nodes', () => {
    renderCanvas(graph({ nodes: [], edges: [] }))
    expect(screen.getByText('This graph has no nodes')).toBeInTheDocument()
  })

  it('shows the minimap only for larger graphs', () => {
    renderCanvas()
    expect(document.querySelector('.react-flow__minimap')).not.toBeInTheDocument()
  })

  it('adds the minimap once the graph has enough nodes', () => {
    const many = graph({
      nodes: Array.from({ length: MINIMAP_MIN_NODES }, (_, i) => node(`n${i}`)),
      edges: [],
    })
    renderCanvas(many)
    expect(document.querySelector('.react-flow__minimap')).toBeInTheDocument()
  })
})
