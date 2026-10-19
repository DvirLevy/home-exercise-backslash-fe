import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { HealthBanner, HealthIndicator } from '@/app/HealthBanner'
import { API } from '../msw/fixtures'
import { server } from '../msw/server'
import { renderComponent } from '../test-utils/render'

describe('HealthBanner', () => {
  it('shows nothing and an online dot when the API is healthy', async () => {
    renderComponent(
      <>
        <HealthBanner />
        <HealthIndicator />
      </>,
    )
    expect(await screen.findByText('API online')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a banner when the API is unreachable', async () => {
    server.use(http.get(`${API}/health`, () => HttpResponse.error()))
    renderComponent(
      <>
        <HealthBanner />
        <HealthIndicator />
      </>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent("Can't reach the API")
    expect(screen.getByText('API offline')).toBeInTheDocument()
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
