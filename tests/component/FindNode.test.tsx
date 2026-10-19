import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FindNode } from '@/features/visualization/components/FindNode'

const names = ['frontend', 'order-service', 'order-db', 'user-service']

describe('FindNode', () => {
  it('lists nothing until the user types', () => {
    render(<FindNode names={names} onPick={vi.fn()} />)
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('filters case-insensitively by substring', async () => {
    render(<FindNode names={names} onPick={vi.fn()} />)
    await userEvent.type(screen.getByRole('combobox', { name: 'Find a node' }), 'ORDER')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'order-service',
      'order-db',
    ])
  })

  it('hands the chosen name over and clears the box', async () => {
    const onPick = vi.fn()
    render(<FindNode names={names} onPick={onPick} />)
    const input = screen.getByRole('combobox', { name: 'Find a node' })
    await userEvent.type(input, 'user')
    await userEvent.click(screen.getByRole('option', { name: 'user-service' }))
    expect(onPick).toHaveBeenCalledWith('user-service')
    expect(input).toHaveValue('')
  })

  it('can be driven from the keyboard', async () => {
    const onPick = vi.fn()
    render(<FindNode names={names} onPick={onPick} />)
    await userEvent.type(screen.getByRole('combobox', { name: 'Find a node' }), 'front{Enter}')
    expect(onPick).toHaveBeenCalledWith('frontend')
  })

  it('says so when nothing matches', async () => {
    render(<FindNode names={names} onPick={vi.fn()} />)
    await userEvent.type(screen.getByRole('combobox', { name: 'Find a node' }), 'zzz')
    expect(screen.getByText('No node matches')).toBeInTheDocument()
  })

  it('caps the number of suggestions', async () => {
    const many = Array.from({ length: 30 }, (_, i) => `svc-${i}`)
    render(<FindNode names={many} onPick={vi.fn()} />)
    await userEvent.type(screen.getByRole('combobox', { name: 'Find a node' }), 'svc')
    expect(screen.getAllByRole('option')).toHaveLength(8)
  })
})
