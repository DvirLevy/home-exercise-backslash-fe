import { http, HttpResponse } from 'msw'
import type { GraphDetail } from '@/types/api'
import { API, apiError, graph } from './fixtures'
import { readMultipart } from './multipart'

type Stored = GraphDetail & { createdAt: string; updatedAt: string }

/** A small in-memory stand-in for the real backend, shared by component and integration tests. */
class FakeBackend {
  graphs = new Map<string, Stored>()
  private counter = 0

  reset() {
    this.graphs.clear()
    this.counter = 0
  }

  add(g: Partial<GraphDetail> = {}): Stored {
    const id = g.id ?? `g${++this.counter}`
    const now = new Date().toISOString()
    const stored = { ...graph({ id }), ...g, id, createdAt: now, updatedAt: now }
    this.graphs.set(id, stored)
    return stored
  }

  summary(g: Stored) {
    return {
      id: g.id,
      name: g.name,
      version: g.version,
      nodeCount: g.nodes.length,
      edgeCount: g.edges.length,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }
  }
}

export const backend = new FakeBackend()

const notFound = () =>
  HttpResponse.json(apiError('GRAPH_NOT_FOUND', 'Graph not found'), { status: 404 })

async function readUpload(request: Request) {
  const form = await readMultipart(request)
  const name = form.fields.name ?? null
  const parsed = JSON.parse(form.files.file?.content ?? '{}') as {
    nodes: { name: string; kind: string }[]
    edges: { from: string; to: string }[]
  }
  const defined = new Set(parsed.nodes.map((n) => n.name))
  const placeholders = [
    ...new Set(parsed.edges.flatMap((e) => [e.from, e.to]).filter((n) => !defined.has(n))),
  ]
  const base = graph().nodes[0]!
  const nodes = [
    ...parsed.nodes.map((n) => ({ ...base, ...n })),
    ...placeholders.map((p) => ({ ...base, name: p, kind: null, placeholder: true })),
  ]
  return { name, nodes, edges: parsed.edges, placeholders }
}

export const handlers = [
  http.get(`${API}/health`, () =>
    HttpResponse.json({
      status: 'ok',
      database: 'up',
      uptime: 1,
      timestamp: new Date().toISOString(),
    }),
  ),

  http.get(`${API}/api/v1/graphs`, () =>
    HttpResponse.json([...backend.graphs.values()].reverse().map((g) => backend.summary(g))),
  ),

  http.get(`${API}/api/v1/graphs/:id`, ({ params }) => {
    const g = backend.graphs.get(params.id as string)
    return g ? HttpResponse.json(g) : notFound()
  }),

  http.post(`${API}/api/v1/graphs`, async ({ request }) => {
    const upload = await readUpload(request)
    const g = backend.add({ name: upload.name ?? '', nodes: upload.nodes, edges: upload.edges })
    return HttpResponse.json(
      { ...backend.summary(g), placeholders: upload.placeholders },
      { status: 201 },
    )
  }),

  http.put(`${API}/api/v1/graphs/:id`, async ({ request, params }) => {
    const g = backend.graphs.get(params.id as string)
    if (!g) return notFound()
    const ifMatch = request.headers.get('if-match')
    if (ifMatch !== null && ifMatch !== `"${g.version}"`) {
      return HttpResponse.json(
        apiError('VERSION_CONFLICT', 'The graph was changed by someone else'),
        {
          status: 409,
        },
      )
    }
    const upload = await readUpload(request)
    Object.assign(g, {
      name: upload.name ?? g.name,
      nodes: upload.nodes,
      edges: upload.edges,
      version: g.version + 1,
    })
    return HttpResponse.json({ ...backend.summary(g), placeholders: upload.placeholders })
  }),

  http.patch(`${API}/api/v1/graphs/:id`, async ({ request, params }) => {
    const g = backend.graphs.get(params.id as string)
    if (!g) return notFound()
    g.name = ((await request.json()) as { name: string }).name
    return HttpResponse.json(backend.summary(g))
  }),

  http.delete(`${API}/api/v1/graphs/:id`, ({ params }) =>
    backend.graphs.delete(params.id as string)
      ? new HttpResponse(null, { status: 204 })
      : notFound(),
  ),
]
