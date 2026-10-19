import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { backend } from '../msw/backend'
import { node } from '../msw/fixtures'
import { renderApp } from '../test-utils/render'

function seed() {
  backend.add({
    id: 'a',
    name: 'Train Ticket',
    nodes: [
      node('frontend', { publicExposed: true }),
      node('order-service', {
        path: 'train-ticket/ts-order-service',
        vulnerabilities: [{ severity: 'high', message: 'Tainted path', file: 'Order.java' }],
      }),
      node('prod-postgresdb', { kind: 'rds', metadata: { engine: 'postgres' } }),
    ],
    edges: [
      { from: 'frontend', to: 'order-service' },
      { from: 'order-service', to: 'prod-postgresdb' },
    ],
  })
}

describe('graph view', () => {
  it('draws the graph, and a click on a node opens its details', async () => {
    seed()
    renderApp('/graphs/a')

    expect(await screen.findByTestId('node-order-service')).toBeInTheDocument()
    expect(screen.getByText('Select a node to see its details.')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('node-order-service'))

    const panel = screen.getByRole('complementary', { name: 'Details panel' })
    expect(within(panel).getByRole('heading', { name: 'order-service' })).toBeInTheDocument()
    expect(within(panel).getByText('Tainted path')).toBeInTheDocument()
    expect(within(panel).getByText('train-ticket/ts-order-service')).toBeInTheDocument()
  })

  it('closes the details from the panel and from the background', async () => {
    seed()
    renderApp('/graphs/a')
    fireEvent.click(await screen.findByTestId('node-frontend'))
    await userEvent.click(screen.getByRole('button', { name: 'Close details' }))
    expect(screen.getByText('Select a node to see its details.')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('node-frontend'))
    fireEvent.click(document.querySelector('.react-flow__pane')!)
    expect(screen.getByText('Select a node to see its details.')).toBeInTheDocument()
  })

  it('finds a node by name and opens its details', async () => {
    seed()
    renderApp('/graphs/a')
    await screen.findByTestId('node-frontend')

    await userEvent.type(screen.getByRole('combobox', { name: 'Find a node' }), 'postgres')
    await userEvent.click(screen.getByRole('option', { name: 'prod-postgresdb' }))

    const panel = screen.getByRole('complementary', { name: 'Details panel' })
    expect(within(panel).getByRole('heading', { name: 'prod-postgresdb' })).toBeInTheDocument()
    expect(within(panel).getByText(/"engine": "postgres"/)).toBeInTheDocument()
  })

  it('forgets the selection when another graph is opened', async () => {
    seed()
    backend.add({ id: 'b', name: 'Other', nodes: [node('frontend')], edges: [] })
    const { router } = renderApp('/graphs/a')
    fireEvent.click(await screen.findByTestId('node-frontend'))
    expect(screen.getByRole('heading', { name: 'frontend' })).toBeInTheDocument()

    await router.navigate('/graphs/b')
    await screen.findByText('This graph has no edges')
    expect(screen.getByText('Select a node to see its details.')).toBeInTheDocument()
  })

  it('redraws after the file is replaced', async () => {
    seed()
    renderApp('/graphs/a')
    await screen.findByTestId('node-frontend')

    backend.graphs.get('a')!.nodes = [node('brand-new')]
    backend.graphs.get('a')!.edges = []
    backend.graphs.get('a')!.version = 2
    await userEvent.click(screen.getByRole('button', { name: 'Rename' })) // triggers a refetch on save
    const input = await screen.findByLabelText('Name')
    await userEvent.clear(input)
    await userEvent.type(input, 'Renamed')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByTestId('node-brand-new')).toBeInTheDocument())
    expect(screen.queryByTestId('node-frontend')).not.toBeInTheDocument()
  })
})
