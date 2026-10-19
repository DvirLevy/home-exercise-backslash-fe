import { http, HttpResponse } from 'msw'
import type { GraphDetail, GraphNode, Role } from '@/types/api'
import { API, apiError, graph } from './fixtures'
import { readMultipart } from './multipart'

type Stored = GraphDetail & { createdAt: string; updatedAt: string }

/** A small in-memory stand-in for the real backend, shared by component and integration tests. */
type CustomFilter = {
  key: string
  description: string | null
  /** null = the stored rule can no longer be compiled ("unavailable"). */
  predicate: ((node: GraphNode) => boolean) | null
}

const BUILTIN: Record<string, { description: string; predicate: (n: GraphNode) => boolean }> = {
  public: {
    description: 'Services that are publicly exposed.',
    predicate: (n) => n.publicExposed === true,
  },
  sink: {
    description: 'Database sinks: nodes whose kind is rds or sql.',
    predicate: (n) => n.kind === 'rds' || n.kind === 'sql',
  },
  vulnerable: {
    description: 'Nodes that have at least one vulnerability.',
    predicate: (n) => n.vulnerabilities.length > 0,
  },
}

class FakeBackend {
  graphs = new Map<string, Stored>()
  customFilters: CustomFilter[] = []
  /** Query strings of every GET /routes the app made. */
  routeRequests: URLSearchParams[] = []
  private counter = 0

  reset() {
    this.graphs.clear()
    this.customFilters = []
    this.routeRequests = []
    this.counter = 0
  }

  filterPredicate(key: string): ((n: GraphNode) => boolean) | null | undefined {
    if (BUILTIN[key]) return BUILTIN[key].predicate
    const custom = this.customFilters.find((f) => f.key === key)
    return custom ? custom.predicate : undefined
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

/** Nodes reachable from `from` following edges (or against them when `reverse`), including `from`. */
function reach(from: Set<string>, edges: { from: string; to: string }[], reverse: boolean) {
  const seen = new Set(from)
  const queue = [...from]
  while (queue.length > 0) {
    const current = queue.pop()!
    for (const e of edges) {
      const [a, b] = reverse ? [e.to, e.from] : [e.from, e.to]
      if (a === current && !seen.has(b)) {
        seen.add(b)
        queue.push(b)
      }
    }
  }
  return seen
}

/** Route semantics of the real API: the subgraph on some start → (through) → end walk. */
function computeRoute(g: Stored, query: Record<Role, string[]>) {
  const pick = (keys: string[]) =>
    new Set(
      g.nodes.filter((n) => keys.some((k) => backend.filterPredicate(k)?.(n))).map((n) => n.name),
    )
  const all = new Set(g.nodes.map((n) => n.name))
  const S = query.start.length ? pick(query.start) : all
  const E = query.end.length ? pick(query.end) : all
  const T = query.through.length ? pick(query.through) : all

  const fromS = reach(S, g.edges, false)
  const toE = reach(E, g.edges, true)
  const onRoute = new Set<string>()
  for (const t of T) {
    if (!fromS.has(t) || !toE.has(t)) continue
    for (const n of reach(new Set([t]), g.edges, true)) if (fromS.has(n)) onRoute.add(n)
    for (const n of reach(new Set([t]), g.edges, false)) if (toE.has(n)) onRoute.add(n)
  }

  const keys = Object.values(query).flat()
  const nodes = g.nodes
    .filter((n) => onRoute.has(n.name))
    .map((n) => ({
      ...n,
      matched: {
        roles: [
          query.start.length && S.has(n.name) ? 'start' : null,
          query.through.length && T.has(n.name) ? 'through' : null,
          query.end.length && E.has(n.name) ? 'end' : null,
        ].filter(Boolean) as Role[],
        filters: keys.filter((k, i) => keys.indexOf(k) === i && backend.filterPredicate(k)?.(n)),
      },
    }))
  const edges = g.edges.filter((e) => onRoute.has(e.from) && onRoute.has(e.to))
  return { nodes, edges }
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

  http.get(`${API}/api/v1/graphs/:id/filters`, ({ params }) => {
    const g = backend.graphs.get(params.id as string)
    if (!g) return notFound()
    const now = new Date().toISOString()
    const describe = (
      key: string,
      description: string | null,
      predicate: ((n: GraphNode) => boolean) | null,
      builtin: boolean,
    ) => ({
      key,
      description,
      builtin,
      definition: { field: 'kind', op: 'eq', value: 'x' },
      matchCount: predicate ? g.nodes.filter(predicate).length : null,
      createdAt: now,
      updatedAt: now,
    })
    return HttpResponse.json([
      ...Object.entries(BUILTIN).map(([key, f]) => describe(key, f.description, f.predicate, true)),
      ...backend.customFilters.map((f) => describe(f.key, f.description, f.predicate, false)),
    ])
  }),

  http.get(`${API}/api/v1/graphs/:id/routes`, ({ request, params }) => {
    const g = backend.graphs.get(params.id as string)
    if (!g) return notFound()
    const url = new URL(request.url)
    backend.routeRequests.push(url.searchParams)
    const query = {
      start: url.searchParams.getAll('start'),
      through: url.searchParams.getAll('through'),
      end: url.searchParams.getAll('end'),
    }
    const used = Object.values(query).flat()
    const unknown = used.filter((k) => backend.filterPredicate(k) === undefined)
    if (unknown.length > 0) {
      return HttpResponse.json(
        apiError(
          'UNKNOWN_FILTER',
          'The query uses filters this graph does not have',
          unknown.map((k) => ({ path: 'start', message: `Unknown filter "${k}"` })),
        ),
        { status: 400 },
      )
    }
    if (used.some((k) => backend.filterPredicate(k) === null)) {
      return HttpResponse.json(
        apiError('FILTER_UNAVAILABLE', 'A stored filter rule can no longer be compiled'),
        {
          status: 409,
        },
      )
    }
    return HttpResponse.json({
      graphId: g.id,
      version: g.version,
      applied: query,
      ...computeRoute(g, query),
    })
  }),
]
