import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CanvasToolbar } from '@/features/visualization/components/CanvasToolbar'

function setup(props: Partial<React.ComponentProps<typeof CanvasToolbar>> = {}) {
  const onModeChange = vi.fn()
  render(
    <CanvasToolbar
      mode="highlight"
      onModeChange={onModeChange}
      highlightDisabled={false}
      summary={null}
      updating={false}
      {...props}
    />,
  )
  return onModeChange
}

describe('CanvasToolbar', () => {
  it('offers Highlight route (checked by default) and Route only', () => {
    setup()
    expect(screen.getByRole('radio', { name: 'Highlight route' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Route only' })).not.toBeChecked()
  })

  it('switches the view', async () => {
    const onModeChange = setup()
    await userEvent.click(screen.getByRole('radio', { name: 'Route only' }))
    expect(onModeChange).toHaveBeenCalledWith('routeOnly')
  })

  it('disables Highlight route when the graph is too large', () => {
    setup({ mode: 'routeOnly', highlightDisabled: true })
    expect(screen.getByRole('radio', { name: 'Highlight route' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Route only' })).toBeChecked()
  })

  it('summarizes the result', () => {
    setup({ summary: { nodes: 21, edges: 40 } })
    expect(screen.getByRole('status')).toHaveTextContent('21 nodes · 40 edges on matching routes')
  })

  it('uses singular forms', () => {
    setup({ summary: { nodes: 1, edges: 1 } })
    expect(screen.getByRole('status')).toHaveTextContent('1 node · 1 edge on matching routes')
  })

  it('shows nothing about results without a route, and an updating hint while refetching', () => {
    setup({ updating: true })
    expect(screen.queryByText(/on matching routes/)).not.toBeInTheDocument()
    expect(screen.getByText('Updating route…')).toBeInTheDocument()
  })
})
