import type { RouteObject } from 'react-router'
import { GraphPage } from '@/pages/GraphPage'
import { HomePage } from '@/pages/HomePage'
import { AppShell } from './AppShell'

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/graphs/:id', element: <GraphPage /> },
      { path: '*', element: <HomePage /> },
    ],
  },
]
