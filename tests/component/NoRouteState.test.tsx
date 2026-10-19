import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoRouteState } from '@/features/filters/components/NoRouteState'

// The sentence is split over <code> elements, so read the whole paragraph.
const message = () => screen.getByText(/Try removing a role/).closest('p')

describe('NoRouteState', () => {
  it('names the start and end filters of the query', () => {
    render(
      <NoRouteState query={{ start: ['public'], through: [], end: ['sink'] }} onClear={vi.fn()} />,
    )
    expect(screen.getByText('No route matches')).toBeInTheDocument()
    expect(message()).toHaveTextContent('No path from public to sink. Try removing a role.')
  })

  it('joins several filters of a role with "or" and mentions the through role', () => {
    render(
      <NoRouteState query={{ start: ['a', 'b'], through: ['t'], end: [] }} onClear={vi.fn()} />,
    )
    expect(message()).toHaveTextContent('No path from a or b through t.')
  })

  it('works for a query with only a through role', () => {
    render(<NoRouteState query={{ start: [], through: ['t'], end: [] }} onClear={vi.fn()} />)
    expect(message()).toHaveTextContent('No path passes through t.')
  })

  it('clears the query', async () => {
    const onClear = vi.fn()
    render(<NoRouteState query={{ start: ['a'], through: [], end: [] }} onClear={onClear} />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear query' }))
    expect(onClear).toHaveBeenCalledOnce()
  })
})
