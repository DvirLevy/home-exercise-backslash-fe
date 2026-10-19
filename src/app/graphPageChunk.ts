import { lazy } from 'react'

/**
 * The graph page pulls in React Flow, d3 and dagre (the bulk of the app), which the home screen does not
 * need. It is a separate chunk, loaded on first use and prefetched when the browser is idle.
 */
const loadGraphPage = () => import('@/pages/GraphPage')

export const LazyGraphPage = lazy(() => loadGraphPage().then((m) => ({ default: m.GraphPage })))

export function prefetchGraphPage() {
  void loadGraphPage()
}
