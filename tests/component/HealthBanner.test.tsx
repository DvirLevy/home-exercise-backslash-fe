import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { HealthBanner } from '@/app/HealthBanner'
import { API } from '../msw/fixtures'
import { server } from '../msw/server'
import { renderComponent } from '../test-utils/render'

describe('HealthBanner', () => {
  it('shows nothing when the API is healthy', async () => {
    renderComponent(<HealthBanner />)
    // Give the health query time to settle before asserting that nothing is shown.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('never shows an "API online" status', async () => {
    renderComponent(<HealthBanner />)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByText(/API online/i)).not.toBeInTheDocument()
  })

  it('shows a banner when the API is unreachable', async () => {
    server.use(http.get(`${API}/health`, () => HttpResponse.error()))
    renderComponent(<HealthBanner />)
    expect(await screen.findByRole('alert')).toHaveTextContent("Can't reach the API")
  })

  it('shows a banner when the database is down (503)', async () => {
    server.use(
      http.get(`${API}/health`, () =>
        HttpResponse.json(
          { status: 'unavailable', database: 'down', uptime: 1, timestamp: 't' },
          { status: 503 },
        ),
      ),
    )
    renderComponent(<HealthBanner />)
    expect(await screen.findByRole('alert')).toHaveTextContent('database is down')
  })
})
