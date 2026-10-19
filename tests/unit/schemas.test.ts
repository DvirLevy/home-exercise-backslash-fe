import {
  apiErrorBodySchema,
  filterSchema,
  graphDetailSchema,
  graphWriteResultSchema,
  healthReportSchema,
  routeResultSchema,
} from '@/services/schemas'
import { graph, node } from '../msw/fixtures'

describe('response schemas', () => {
  it('accepts a graph detail and keeps unknown fields of edges', () => {
    const parsed = graphDetailSchema.parse(
      graph({ edges: [{ from: 'a', to: 'b', extra: { protocol: 'http' } }] }),
    )
    expect(parsed.edges[0]?.extra).toEqual({ protocol: 'http' })
  })

  it('accepts a placeholder node with null fields', () => {
    const placeholder = node('ghost', {
      kind: null,
      language: null,
      path: null,
      publicExposed: null,
      placeholder: true,
    })
    expect(graphDetailSchema.parse(graph({ nodes: [placeholder] })).nodes[0]?.placeholder).toBe(
      true,
    )
  })

  it('fails loudly when the contract is broken', () => {
    expect(() => graphDetailSchema.parse({ ...graph(), nodes: [{ name: 1 }] })).toThrow()
    expect(() => healthReportSchema.parse({ status: 'maybe' })).toThrow()
  })

  it('requires placeholders on a write result', () => {
    const base = {
      id: 'g',
      name: 'n',
      version: 1,
      nodeCount: 0,
      edgeCount: 0,
      createdAt: 'x',
      updatedAt: 'x',
    }
    expect(() => graphWriteResultSchema.parse(base)).toThrow()
    expect(graphWriteResultSchema.parse({ ...base, placeholders: ['ghost'] }).placeholders).toEqual(
      ['ghost'],
    )
  })

  it('accepts a filter with a null matchCount (unavailable)', () => {
    const f = {
      key: 'broken',
      description: null,
      builtin: false,
      definition: { op: 'eq' },
      matchCount: null,
      createdAt: 'x',
      updatedAt: 'x',
    }
    expect(filterSchema.parse(f).matchCount).toBeNull()
  })

  it('parses a route result with matched roles', () => {
    const parsed = routeResultSchema.parse({
      graphId: 'g',
      version: 1,
      applied: { start: ['public'], end: [], through: [] },
      nodes: [{ ...node('a'), matched: { roles: ['start'], filters: ['public'] } }],
      edges: [],
    })
    expect(parsed.nodes[0]?.matched.roles).toEqual(['start'])
  })

  it('parses the API error shape with and without details', () => {
    expect(apiErrorBodySchema.safeParse({ error: { code: 'X', message: 'm' } }).success).toBe(true)
    expect(
      apiErrorBodySchema.parse({
        error: { code: 'X', message: 'm', details: [{ path: 'a.b', message: 'bad' }] },
      }).error.details,
    ).toHaveLength(1)
    expect(apiErrorBodySchema.safeParse({ message: 'nope' }).success).toBe(false)
  })
})
