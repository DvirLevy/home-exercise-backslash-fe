import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { backend } from '../msw/backend'
import { node } from '../msw/fixtures'
import { renderApp } from '../test-utils/render'

/**
 * frontend, gateway (public) → orders (vulnerable) → db (rds)
 * gateway → admin → queue   (an unrelated branch)
 */
function seed() {
  backend.add({
    id: 'a',
    name: 'Train Ticket',
    nodes: [
      node('frontend', { publicExposed: true }),
      node('gateway', { publicExposed: true }),
      node('orders', { vulnerabilities: [{ severity: 'high', message: 'Tainted path' }] }),
      node('admin'),
      node('db', { kind: 'rds' }),
      node('queue', { kind: 'sqs' }),
    ],
    edges: [
      { from: 'frontend', to: 'orders' },
      { from: 'orders', to: 'db' },
      { from: 'gateway', to: 'admin' },
      { from: 'admin', to: 'queue' },
    ],
  })
}

const card = (name: string) => screen.getByTestId(`node-${name}`)
const isDimmed = (name: string) => card(name).hasAttribute('data-dimmed')
const urlOf = (router: { state: { location: { search: string } } }) => router.state.location.search

async function pick(roleLabel: string, key: RegExp) {
  await userEvent.click(await screen.findByRole('button', { name: `Add filter to "${roleLabel}"` }))
  await userEvent.click(screen.getByRole('option', { name: key }))
}

describe('route query', () => {
  it('shows the plain graph before any filter is chosen, and runs no query', async () => {
    seed()
    renderApp('/graphs/a')
    await screen.findByTestId('node-frontend')
    expect(['frontend', 'orders', 'admin', 'db'].some(isDimmed)).toBe(false)
    expect(screen.queryByText(/on matching routes/)).not.toBeInTheDocument()
    expect(backend.routeRequests).toHaveLength(0)
  })

  it('picking filters updates the URL and highlights the route on the whole graph', async () => {
    seed()
    const { router } = renderApp('/graphs/a')
    await screen.findByTestId('node-frontend')

    await pick('Start at', /^public/)
    await pick('End at', /^sink/)

    expect(urlOf(router)).toBe('?start=public&end=sink')
    expect(await screen.findByText(/on matching routes/)).toHaveTextContent(
      '3 nodes · 2 edges on matching routes',
    )
    // The whole graph is still drawn; what is off the route is dimmed.
    expect(['frontend', 'orders', 'db'].map(isDimmed)).toEqual([false, false, false])
    expect(['gateway', 'admin', 'queue'].map(isDimmed)).toEqual([true, true, true])
    // Roles are shown as text tags, not just colour.
    expect(within(card('frontend')).getByText('START')).toBeInTheDocument()
    expect(within(card('db')).getByText('END')).toBeInTheDocument()
    expect(card('frontend')).toHaveAttribute('data-role', 'start')
    expect(card('db')).toHaveAttribute('data-role', 'end')
    expect(card('queue')).not.toHaveAttribute('data-role')
  })

  it('the Route only toggle draws just the matching routes, and back', async () => {
    seed()
    renderApp('/graphs/a?start=public&end=sink')
    await screen.findByText(/on matching routes/)

    await userEvent.click(screen.getByRole('radio', { name: 'Route only' }))
    expect(card('orders')).toBeInTheDocument()
    expect(screen.queryByTestId('node-gateway')).not.toBeInTheDocument()
    expect(screen.queryByTestId('node-queue')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: 'Highlight route' }))
    expect(card('gateway')).toBeInTheDocument()
    expect(isDimmed('gateway')).toBe(true)
  })

  it('reproduces the same result from a shared URL', async () => {
    seed()
    renderApp('/graphs/a?start=public&through=vulnerable&end=sink')
    expect(await screen.findByText(/on matching routes/)).toHaveTextContent('3 nodes')
    expect(within(card('orders')).getByText('THROUGH')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove public from Start at' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Remove vulnerable from Pass through' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove sink from End at' })).toBeInTheDocument()
  })

  it('sends several filters of a role as repeated parameters (OR)', async () => {
    seed()
    renderApp('/graphs/a')
    await screen.findByTestId('node-frontend')

    await pick('Start at', /^public/)
    await pick('Start at', /^vulnerable/)

    await waitFor(() =>
      expect(backend.routeRequests.at(-1)?.getAll('start')).toEqual(['public', 'vulnerable']),
    )
    expect(screen.getByText('OR')).toBeInTheDocument()
  })

  it('queries again when a chip is removed, and Clear returns to the plain graph', async () => {
    seed()
    const { router } = renderApp('/graphs/a?start=public&end=sink')
    await screen.findByText(/on matching routes/)

    await userEvent.click(screen.getByRole('button', { name: 'Remove sink from End at' }))
    expect(urlOf(router)).toBe('?start=public')
    await waitFor(() => expect(isDimmed('queue')).toBe(false)) // public reaches everything but frontend/gateway roots

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(urlOf(router)).toBe('')
    await waitFor(() => expect(screen.queryByText(/on matching routes/)).not.toBeInTheDocument())
    expect(['frontend', 'gateway', 'orders', 'admin', 'db', 'queue'].some(isDimmed)).toBe(false)
  })

  it('shows the matched roles and filters of the selected node', async () => {
    seed()
    renderApp('/graphs/a?start=public&through=vulnerable&end=sink')
    await screen.findByText(/on matching routes/)

    fireEvent.click(card('orders'))
    const details = screen.getByRole('region', { name: 'Details of orders' })
    expect(within(details).getByText('THROUGH')).toBeInTheDocument()
    expect(within(details).getByText('vulnerable')).toBeInTheDocument()
  })

  it('does not offer unavailable filters', async () => {
    seed()
    backend.customFilters.push({
      key: 'broken-rule',
      description: 'Rule no longer compiles',
      predicate: null,
    })
    renderApp('/graphs/a')
    await userEvent.click(await screen.findByRole('button', { name: 'Add filter to "Start at"' }))
    const option = screen.getByRole('option', { name: /broken-rule/ })
    expect(option).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(option)
    expect(backend.routeRequests).toHaveLength(0)
  })

  it('lists custom filters with their descriptions and match counts', async () => {
    seed()
    backend.customFilters.push({
      key: 'rds-only',
      description: 'Relational databases',
      predicate: (n) => n.kind === 'rds',
    })
    renderApp('/graphs/a')
    await userEvent.click(await screen.findByRole('button', { name: 'Add filter to "End at"' }))
    const option = screen.getByRole('option', { name: /rds-only/ })
    expect(option).toHaveTextContent('Relational databases')
    expect(option).toHaveTextContent('1 node')
  })
})

describe('route query: empty and error states', () => {
  it('explains when no route matches, and Clear query goes back to the plain graph', async () => {
    seed()
    const { router } = renderApp('/graphs/a?start=sink&end=public')
    expect(await screen.findByText('No route matches')).toBeInTheDocument()
    expect(screen.getByText(/Try removing a role/).closest('p')).toHaveTextContent(
      'No path from sink to public.',
    )
    expect(isDimmed('frontend')).toBe(false) // nothing is dimmed when there is no route

    await userEvent.click(screen.getByRole('button', { name: 'Clear query' }))
    expect(urlOf(router)).toBe('')
    await waitFor(() => expect(screen.queryByText('No route matches')).not.toBeInTheDocument())
  })

  it('reports a filter that does not exist (400) and keeps the graph visible', async () => {
    seed()
    renderApp('/graphs/a?start=ghost-filter')
    expect(
      await screen.findByText('This query uses a filter the graph does not have'),
    ).toBeInTheDocument()
    expect(screen.getByText('(not found in this graph)')).toBeInTheDocument()
    expect(card('frontend')).toBeInTheDocument()
    expect(isDimmed('frontend')).toBe(false)
  })

  it('reports an unavailable filter (409)', async () => {
    seed()
    backend.customFilters.push({ key: 'broken-rule', description: null, predicate: null })
    renderApp('/graphs/a?start=broken-rule')
    expect(await screen.findByText('A filter in this query is unavailable')).toBeInTheDocument()
    expect(screen.getByText('(unavailable)')).toBeInTheDocument()
  })
})

describe('large graphs', () => {
  function seedLarge() {
    backend.add({
      id: 'big',
      name: 'Huge',
      nodes: Array.from({ length: 1501 }, (_, i) => node(`svc-${i}`, { publicExposed: i < 2 })),
      edges: [],
    })
  }

  it('does not draw the whole graph and asks for filters', async () => {
    seedLarge()
    renderApp('/graphs/big')
    expect(await screen.findByText(/too large to draw whole/)).toBeInTheDocument()
    expect(screen.queryByTestId('node-svc-0')).not.toBeInTheDocument()
    expect(screen.queryByTestId('node-svc-1000')).not.toBeInTheDocument()
  })

  it('draws only the route once filters are chosen, with Highlight route disabled', async () => {
    seedLarge()
    renderApp('/graphs/big')
    await screen.findByText(/too large to draw whole/)

    await pick('Start at', /^public/)

    expect(await screen.findByTestId('node-svc-0')).toBeInTheDocument()
    expect(screen.getByTestId('node-svc-1')).toBeInTheDocument()
    expect(screen.queryByTestId('node-svc-2')).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Highlight route' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Route only' })).toBeChecked()
  })
})
