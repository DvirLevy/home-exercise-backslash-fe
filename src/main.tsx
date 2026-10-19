import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './env'
import './design-system/globals.css'
import { App } from './app/App'
import { prefetchGraphPage } from './app/graphPageChunk'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Fetch the graph page chunk once the first screen is up, so opening a graph does not wait for it.
if ('requestIdleCallback' in window) window.requestIdleCallback(prefetchGraphPage)
else setTimeout(prefetchGraphPage, 1500)
