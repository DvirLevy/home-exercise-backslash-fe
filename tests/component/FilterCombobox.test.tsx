import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterCombobox } from '@/features/filters/components/FilterCombobox'
import { filter } from '../msw/fixtures'

const filters = [
  filter('public', { description: 'Publicly exposed services', matchCount: 2, builtin: true }),
  filter('sink', { description: 'Database sinks', matchCount: 1, builtin: true }),
  filter('broken-rule', { description: 'Stored rule no longer compiles', matchCount: null }),
]

async function open(props: Partial<React.ComponentProps<typeof FilterCombobox>> = {}) {
  const onPick = vi.fn()
  render(
    <FilterCombobox roleLabel="Start at" filters={filters} taken={[]} onPick={onPick} {...props} />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Add filter to "Start at"' }))
  return onPick
}

describe('FilterCombobox', () => {
  it('shows each filter with its description and match count', async () => {
    await open()
    const publicOption = screen.getByRole('option', { name: /^public/ })
    expect(publicOption).toHaveTextContent('Publicly exposed services')
    expect(publicOption).toHaveTextContent('2 nodes')
    expect(screen.getByRole('option', { name: /^sink/ })).toHaveTextContent('1 node')
  })

  it('shows unavailable filters but does not let the user pick them', async () => {
    const onPick = await open()
    const broken = screen.getByRole('option', { name: /broken-rule/ })
    expect(broken).toHaveAttribute('aria-disabled', 'true')
    expect(broken).toHaveTextContent('unavailable')
    await userEvent.click(broken)
    expect(onPick).not.toHaveBeenCalled()
  })

  it('does not offer filters already chosen for this role', async () => {
    await open({ taken: ['public'] })
    expect(screen.queryByRole('option', { name: /^public/ })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: /^sink/ })).toBeInTheDocument()
  })

  it('picks a filter and closes', async () => {
    const onPick = await open()
    await userEvent.click(screen.getByRole('option', { name: /^sink/ }))
    expect(onPick).toHaveBeenCalledWith('sink')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('searches by key and by description', async () => {
    await open()
    await userEvent.type(screen.getByRole('combobox', { name: /Search filters/ }), 'database')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option', { name: /^sink/ })).toBeInTheDocument()
  })

  it('says so when every filter is already used', async () => {
    await open({ taken: ['public', 'sink', 'broken-rule'] })
    expect(screen.getByText('No filters left to add.')).toBeInTheDocument()
  })

  it('is disabled until the filters have loaded', () => {
    render(<FilterCombobox roleLabel="Start at" filters={undefined} taken={[]} onPick={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Add filter to "Start at"' })).toBeDisabled()
  })
})
