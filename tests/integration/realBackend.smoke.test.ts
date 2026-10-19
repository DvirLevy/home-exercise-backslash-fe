import { http, passthrough } from 'msw'
import { getHealth } from '@/services/health'
import { getGraph, listGraphs } from '@/services/graphs'
import { listFilters } from '@/services/filters'
import { getRoutes } from '@/services/routes'
import { API } from '../msw/fixtures'
import { server } from '../msw/server'

/** Optional: checks our Zod schemas against the real backend. Run with `SMOKE=1 npm test`. */
describe.skipIf(!process.env.SMOKE)('real backend smoke test', () => {
  beforeEach(() => server.use(http.all(`${API}/*`, () => passthrough())))

  it('parses the real health, graphs, filters and routes responses', async () => {
    expect((await getHealth()).status).toBe('ok')

    const graphs = await listGraphs()
    expect(graphs.length).toBeGreaterThan(0)
    const detail = await getGraph(graphs[0]!.id)
    expect(detail.nodes.length).toBe(graphs[0]!.nodeCount)

    const filters = await listFilters(detail.id)
    expect(filters.map((f) => f.key)).toEqual(
      expect.arrayContaining(['public', 'sink', 'vulnerable']),
    )

    const route = await getRoutes(detail.id, {
      start: ['public'],
      through: ['vulnerable'],
      end: ['sink'],
    })
    expect(route.applied).toEqual({ start: ['public'], through: ['vulnerable'], end: ['sink'] })
    const whole = await getRoutes(detail.id, { start: [], through: [], end: [] })
    expect(whole.nodes.length).toBe(detail.nodes.length)
  })
})
