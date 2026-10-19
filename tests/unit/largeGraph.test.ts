import { LARGE_GRAPH_NODES, planCanvas } from '@/features/visualization/utils/largeGraph'

describe('planCanvas', () => {
  it('keeps the requested mode for graphs up to the threshold', () => {
    expect(
      planCanvas({ nodeCount: LARGE_GRAPH_NODES, hasQuery: false, requestedMode: 'highlight' }),
    ).toEqual({
      mode: 'highlight',
      forced: false,
      needsQuery: false,
      routeTooLarge: false,
    })
    expect(planCanvas({ nodeCount: 10, hasQuery: true, requestedMode: 'routeOnly' }).mode).toBe(
      'routeOnly',
    )
  })

  it('forces route-only above the threshold, whatever was requested', () => {
    const plan = planCanvas({
      nodeCount: LARGE_GRAPH_NODES + 1,
      hasQuery: true,
      requestedMode: 'highlight',
    })
    expect(plan).toEqual({
      mode: 'routeOnly',
      forced: true,
      needsQuery: false,
      routeTooLarge: false,
    })
  })

  it('asks for a query when a large graph has none', () => {
    expect(
      planCanvas({ nodeCount: 48_210, hasQuery: false, requestedMode: 'highlight' }),
    ).toMatchObject({ forced: true, needsQuery: true })
  })

  it('flags a route result over the threshold, for any graph size', () => {
    const base = { hasQuery: true, requestedMode: 'highlight' as const }
    expect(
      planCanvas({ ...base, nodeCount: 48_210, routeNodeCount: LARGE_GRAPH_NODES + 1 })
        .routeTooLarge,
    ).toBe(true)
    expect(
      planCanvas({ ...base, nodeCount: 48_210, routeNodeCount: LARGE_GRAPH_NODES }).routeTooLarge,
    ).toBe(false)
    expect(planCanvas({ ...base, nodeCount: 10, routeNodeCount: 2000 }).routeTooLarge).toBe(true)
  })

  it('does not flag a route that is not known yet', () => {
    const base = { nodeCount: 48_210, hasQuery: true, requestedMode: 'highlight' as const }
    expect(planCanvas(base).routeTooLarge).toBe(false)
    expect(planCanvas({ ...base, routeNodeCount: null }).routeTooLarge).toBe(false)
    expect(planCanvas({ ...base, routeNodeCount: undefined }).routeTooLarge).toBe(false)
  })
})
