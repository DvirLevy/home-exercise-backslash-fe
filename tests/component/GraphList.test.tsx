import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { GraphList } from '@/features/graph/components/GraphList'
import { backend } from '../msw/backend'
import { API } from '../msw/fixtures'
import { server } from '../msw/server'
import { renderComponent } from '../test-utils/render'

describe('GraphList', () => {
  it('shows skeletons while loading', () => {
    server.use(http.get(`${API}/api/v1/graphs`, () => new Promise(() => {})))
    renderComponent(<GraphList />)
    expect(screen.getByLabelText('Loading graphs')).toBeInTheDocument()
  })

  it('tells same-named graphs apart by counts and version, and links to each', async () => {
    backend.add({ id: 'a', name: 'Train Ticket', version: 3 })
    backend.add({ id: 'b', name: 'Train Ticket', version: 1, nodes: [], edges: [] })
    renderComponent(<GraphList />)

    const links = await screen.findAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links.map((l) => l.getAttribute('href')).sort()).toEqual(['/graphs/a', '/graphs/b'])
    expect(screen.getByText(/3 nodes · 2 edges · v3/)).toBeInTheDocument()
    expect(screen.getByText(/0 nodes · 0 edges · v1/)).toBeInTheDocument()
  })

  it('marks the open graph as the current page', async () => {
    backend.add({ id: 'a', name: 'One' })
    renderComponent(<GraphList />, '/graphs/a')
    expect(await screen.findByRole('link', { current: 'page' })).toHaveTextContent('One')
  })

  it('shows an error when the list cannot be loaded', async () => {
    server.use(http.get(`${API}/api/v1/graphs`, () => HttpResponse.error()))
    renderComponent(<GraphList />)
    expect(await screen.findByText('Could not load the graphs')).toBeInTheDocument()
  })
})
