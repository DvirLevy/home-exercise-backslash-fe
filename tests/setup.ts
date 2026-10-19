import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { backend } from './msw/backend'
import { server } from './msw/server'

// React Flow needs a few browser APIs that jsdom lacks.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
class DOMMatrixStub {
  m22 = 1
  constructor(transform?: string) {
    const scale = /scale\(([\d.]+)\)/.exec(transform ?? '')
    if (scale) this.m22 = Number(scale[1])
  }
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub)
vi.stubGlobal('DOMMatrixReadOnly', DOMMatrixStub)
vi.stubGlobal('DOMMatrix', DOMMatrixStub)
// cmdk scrolls the active item into view.
Element.prototype.scrollIntoView = () => {}
// jsdom has no layout: give elements a size so React Flow considers nodes visible.
Object.defineProperties(HTMLElement.prototype, {
  offsetWidth: { configurable: true, get: () => 1000 },
  offsetHeight: { configurable: true, get: () => 700 },
})

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  backend.reset()
})
afterAll(() => server.close())
// Note: click React Flow nodes and the pane with fireEvent.click in tests. user-event's mouse-down
// reaches d3-zoom, which expects `event.view` (missing on synthetic events) and throws.
