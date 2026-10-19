import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoleBox } from '@/features/filters/components/RoleBox'
import { filter } from '../msw/fixtures'

const filters = [filter('public'), filter('vulnerable'), filter('broken', { matchCount: null })]

function setup(keys: string[], role: 'start' | 'through' | 'end' = 'through') {
  const onAdd = vi.fn()
  const onRemove = vi.fn()
  render(<RoleBox role={role} keys={keys} filters={filters} onAdd={onAdd} onRemove={onRemove} />)
  return { onAdd, onRemove }
}

describe('RoleBox', () => {
  it('names the role and says that its filters are combined with OR', () => {
    setup([], 'start')
    const box = screen.getByRole('region', { name: 'Start at' })
    expect(within(box).getByText('any of (OR)')).toBeInTheDocument()
  })

  it('shows one chip per filter with OR between them', () => {
    setup(['public', 'vulnerable'])
    const chips = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(chips).toEqual(expect.arrayContaining(['public', 'vulnerable']))
    expect(screen.getByText('OR')).toBeInTheDocument()
  })

  it('shows no OR for a single filter', () => {
    setup(['public'])
    expect(screen.queryByText('OR')).not.toBeInTheDocument()
  })

  it('removes a filter from its chip', async () => {
    const { onRemove } = setup(['public', 'vulnerable'])
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove vulnerable from Pass through' }),
    )
    expect(onRemove).toHaveBeenCalledWith('vulnerable')
  })

  it('adds a filter through the combobox', async () => {
    const { onAdd } = setup(['public'])
    await userEvent.click(screen.getByRole('button', { name: 'Add filter to "Pass through"' }))
    await userEvent.click(screen.getByRole('option', { name: /^vulnerable/ }))
    expect(onAdd).toHaveBeenCalledWith('vulnerable')
  })

  it('flags a chip whose filter does not exist in this graph (e.g. from a shared URL)', () => {
    setup(['ghost-filter'])
    expect(screen.getByText('(not found in this graph)')).toBeInTheDocument()
  })

  it('flags a chip whose filter is unavailable', () => {
    setup(['broken'])
    expect(screen.getByText('(unavailable)')).toBeInTheDocument()
  })
})
