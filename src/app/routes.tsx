import { Suspense } from 'react'
import type { RouteObject } from 'react-router'
import { GraphPageFallback } from '@/pages/GraphPageFallback'
import { HomePage } from '@/pages/HomePage'
import { AppShell } from './AppShell'
import { LazyGraphPage } from './graphPageChunk'

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      {
        path: '/graphs/:id',
        element: (
          <Suspense fallback={<GraphPageFallback />}>
            <LazyGraphPage />
          </Suspense>
        ),
      },
      { path: '*', element: <HomePage /> },
    ],
  },
]
