import type { GraphDetail, GraphNode } from '@/types/api'

export const API = 'http://localhost:3000'

export function node(name: string, overrides: Partial<GraphNode> = {}): GraphNode {
  return {
    name,
    kind: 'service',
    language: 'java',
    path: `repo/${name}`,
    publicExposed: false,
    placeholder: false,
    vulnerabilities: [],
    metadata: null,
    extra: null,
    ...overrides,
  }
}

export function graph(overrides: Partial<GraphDetail> = {}): GraphDetail {
  return {
    id: 'g1',
    name: 'Train Ticket',
    version: 1,
    extra: null,
    nodes: [node('frontend', { publicExposed: true }), node('orders'), node('db', { kind: 'rds' })],
    edges: [
      { from: 'frontend', to: 'orders' },
      { from: 'orders', to: 'db' },
    ],
    ...overrides,
  }
}

export function apiError(
  code: string,
  message: string,
  details?: { path: string; message: string }[],
) {
  return { error: { code, message, ...(details ? { details } : {}) } }
}

export function graphFile(extra: Record<string, unknown> = {}) {
  return new File(
    [
      JSON.stringify({
        nodes: [{ name: 'a', kind: 'service' }],
        edges: [{ from: 'a', to: 'ghost' }],
        ...extra,
      }),
    ],
    'train-ticket.json',
    { type: 'application/json' },
  )
}
