import { http, HttpResponse } from 'msw'
import { ApiError } from '@/services/errors'
import { getHealth } from '@/services/health'
import { deleteGraph, getGraph, replaceGraph, uploadGraph } from '@/services/graphs'
import { getRoutes } from '@/services/routes'
import { queryKeys } from '@/services/queryKeys'
import { API, apiError, graph, graphFile } from '../msw/fixtures'
import { readMultipart } from '../msw/multipart'
import { server } from '../msw/server'

const writeResult = {
  id: 'g1',
  name: 'n',
  version: 2,
  nodeCount: 1,
  edgeCount: 0,
  createdAt: 'x',
  updatedAt: 'x',
  placeholders: [],
}

describe('API client', () => {
  it('repeats array params instead of using start[]=', async () => {
    let url = ''
    server.use(
      http.get(`${API}/api/v1/graphs/g1/routes`, ({ request }) => {
        url = request.url
        return HttpResponse.json({
          graphId: 'g1',
          version: 1,
          applied: { start: [], end: [], through: [] },
          nodes: [],
          edges: [],
        })
      }),
    )
    await getRoutes('g1', { start: ['public', 'vulnerable'], through: [], end: ['sink'] })
    const query = new URL(url).searchParams
    expect(query.getAll('start')).toEqual(['public', 'vulnerable'])
    expect(query.getAll('end')).toEqual(['sink'])
    expect(url).not.toContain('%5B%5D')
    expect(query.has('through')).toBe(false)
  })

  it('sends the upload as multipart without a hand-set Content-Type', async () => {
    let contentType = ''
    let sent: { name: string | null; file: string | null } = { name: null, file: null }
    server.use(
      http.post(`${API}/api/v1/graphs`, async ({ request }) => {
        contentType = request.headers.get('content-type') ?? ''
        const form = await readMultipart(request)
        sent = { name: form.fields.name ?? null, file: form.files.file?.filename ?? null }
        return HttpResponse.json(writeResult, { status: 201 })
      }),
    )
    await uploadGraph({ file: graphFile(), name: 'My graph' })
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/)
    expect(sent).toEqual({ name: 'My graph', file: 'train-ticket.json' })
  })

  it('sends If-Match with the loaded version on replace, and none when overwriting', async () => {
    const seen: (string | null)[] = []
    server.use(
      http.put(`${API}/api/v1/graphs/g1`, ({ request }) => {
        seen.push(request.headers.get('if-match'))
        return HttpResponse.json(writeResult)
      }),
    )
    await replaceGraph('g1', { file: graphFile(), version: 3 })
    await replaceGraph('g1', { file: graphFile() })
    expect(seen).toEqual(['"3"', null])
  })

  it('turns an API error response into an ApiError', async () => {
    server.use(
      http.get(`${API}/api/v1/graphs/zzz`, () =>
        HttpResponse.json(apiError('GRAPH_NOT_FOUND', 'No such graph'), { status: 404 }),
      ),
    )
    const error = await getGraph('zzz').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, code: 'GRAPH_NOT_FOUND' })
  })

  it('rejects a response that breaks the contract', async () => {
    server.use(
      http.get(`${API}/api/v1/graphs/g1`, () => HttpResponse.json({ ...graph(), nodes: 'nope' })),
    )
    await expect(getGraph('g1')).rejects.toThrow()
  })

  it('treats 503 from /health as a report, not an error', async () => {
    server.use(
      http.get(`${API}/health`, () =>
        HttpResponse.json(
          { status: 'unavailable', database: 'down', uptime: 1, timestamp: 't' },
          { status: 503 },
        ),
      ),
    )
    expect((await getHealth()).database).toBe('down')
  })

  it('handles 204 on delete', async () => {
    server.use(
      http.delete(`${API}/api/v1/graphs/g1`, () => new HttpResponse(null, { status: 204 })),
    )
    await expect(deleteGraph('g1')).resolves.toBeUndefined()
  })
})

describe('queryKeys.routes', () => {
  it('sorts roles so equal queries share a cache entry', () => {
    expect(queryKeys.routes('g', { start: ['b', 'a'], through: [], end: [] })).toEqual(
      queryKeys.routes('g', { start: ['a', 'b'], through: [], end: [] }),
    )
  })
})
