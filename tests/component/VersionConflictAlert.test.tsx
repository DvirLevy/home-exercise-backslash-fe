import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VersionConflictAlert } from '@/features/graph/components/VersionConflictAlert'

describe('VersionConflictAlert', () => {
  it('calls the matching handler for each choice', async () => {
    const onReload = vi.fn()
    const onOverwrite = vi.fn()
    render(<VersionConflictAlert onReload={onReload} onOverwrite={onOverwrite} />)
    await userEvent.click(screen.getByRole('button', { name: 'Reload graph' }))
    await userEvent.click(screen.getByRole('button', { name: 'Overwrite anyway' }))
    expect(onReload).toHaveBeenCalledOnce()
    expect(onOverwrite).toHaveBeenCalledOnce()
  })

  it('disables both choices while busy', () => {
    render(<VersionConflictAlert onReload={vi.fn()} onOverwrite={vi.fn()} busy />)
    expect(screen.getByRole('button', { name: 'Reload graph' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Overwrite anyway' })).toBeDisabled()
  })
})
