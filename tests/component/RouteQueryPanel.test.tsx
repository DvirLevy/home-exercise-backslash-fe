import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { RouteQueryPanel } from '@/features/filters/components/RouteQueryPanel'
import { useRouteQuery } from '@/features/filters/hooks/useRouteQuery'
import { ApiError } from '@/services/errors'
import { filter } from '../msw/fixtures'

const filters = [
  filter('public', { builtin: true }),
  filter('vulnerable', { builtin: true }),
  filter('sink', { builtin: true }),
]

/** The panel wired to the URL the way the page does it. */
function Harness({ routeError = null }: { routeError?: ApiError | null }) {
  const { query, add, remove, clear } = useRouteQuery()
  const { search } = useLocation()
  return (
    <>
      <RouteQueryPanel
        query={query}
        filters={filters}
        filtersLoading={false}
        filtersError={null}
        routeError={routeError}
        onAdd={add}
        onRemove={remove}
        onClear={clear}
      />
      <output aria-label="url-search">{search}</output>
    </>
  )
}

const renderAt = (url: string, routeError?: ApiError) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Harness routeError={routeError} />
    </MemoryRouter>,
  )

const pick = async (roleLabel: string, key: RegExp) => {
  await userEvent.click(screen.getByRole('button', { name: `Add filter to "${roleLabel}"` }))
  await userEvent.click(screen.getByRole('option', { name: key }))
}

const search = () => screen.getByLabelText('url-search').textContent

describe('RouteQueryPanel', () => {
  it('shows the three role boxes and the AND note', () => {
    renderAt('/')
    for (const name of ['Start at', 'Pass through', 'End at']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument()
    }
    expect(screen.getByText(/All three roles must hold \(AND\)/)).toBeInTheDocument()
  })

  it('reads the query from the URL', () => {
    renderAt('/?start=public&through=vulnerable&end=sink')
    expect(screen.getByRole('button', { name: 'Remove public from Start at' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Remove vulnerable from Pass through' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove sink from End at' })).toBeInTheDocument()
  })

  it('writes a chosen filter to the URL, one role at a time', async () => {
    renderAt('/')
    await pick('Start at', /^public/)
    expect(search()).toBe('?start=public')
    await pick('End at', /^sink/)
    expect(search()).toBe('?start=public&end=sink')
  })

  it('repeats the parameter for several filters of one role (OR)', async () => {
    renderAt('/')
    await pick('Start at', /^public/)
    await pick('Start at', /^vulnerable/)
    expect(search()).toBe('?start=public&start=vulnerable')
  })

  it('removes a filter from the URL', async () => {
    renderAt('/?start=public&start=vulnerable&end=sink')
    await userEvent.click(screen.getByRole('button', { name: 'Remove public from Start at' }))
    expect(search()).toBe('?start=vulnerable&end=sink')
  })

  it('clears the whole query, and Clear is disabled when there is nothing to clear', async () => {
    renderAt('/?start=public&end=sink')
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(search()).toBe('')
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
  })

  it('keeps unrelated URL params', async () => {
    renderAt('/?keep=me')
    await pick('Start at', /^public/)
    expect(search()).toBe('?keep=me&start=public')
  })

  it('shows a route error with the server details', () => {
    renderAt(
      '/?start=nope',
      new ApiError({
        status: 400,
        code: 'UNKNOWN_FILTER',
        message: 'The query uses filters this graph does not have',
        details: [{ path: 'start', message: 'Unknown filter "nope"' }],
      }),
    )
    expect(screen.getByText('This query uses a filter the graph does not have')).toBeInTheDocument()
    expect(screen.getByText(/Unknown filter "nope"/)).toBeInTheDocument()
  })

  it('shows skeletons while the filters load', () => {
    render(
      <MemoryRouter>
        <RouteQueryPanel
          query={{ start: [], through: [], end: [] }}
          filters={undefined}
          filtersLoading
          filtersError={null}
          routeError={null}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          onClear={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText('Loading filters')).toBeInTheDocument()
  })
})
