import { LARGE_GRAPH_NODES, planCanvas } from '@/features/visualization/utils/largeGraph'

describe('planCanvas', () => {
  it('keeps the requested mode for graphs up to the threshold', () => {
    expect(
      planCanvas({ nodeCount: LARGE_GRAPH_NODES, hasQuery: false, requestedMode: 'highlight' }),
    ).toEqual({
      mode: 'highlight',
      forced: false,
      needsQuery: false,
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
    expect(plan).toEqual({ mode: 'routeOnly', forced: true, needsQuery: false })
  })

  it('asks for a query when a large graph has none', () => {
    expect(
      planCanvas({ nodeCount: 48_210, hasQuery: false, requestedMode: 'highlight' }),
    ).toMatchObject({ forced: true, needsQuery: true })
  })
})
