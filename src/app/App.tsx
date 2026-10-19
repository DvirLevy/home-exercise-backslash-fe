import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { createQueryClient } from './queryClient'
import { router } from './router'

const queryClient = createQueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* Bottom-left, as wide as the sidebar, so a toast never covers the canvas or the details panel. */}
      <Toaster
        position="bottom-left"
        theme="system"
        offset={12}
        style={{ '--width': '232px' } as React.CSSProperties}
      />
    </QueryClientProvider>
  )
}
