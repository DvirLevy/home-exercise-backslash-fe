import { Outlet } from 'react-router'
import { GraphList } from '@/features/graph/components/GraphList'
import { UploadDropzone } from '@/features/graph/components/UploadDropzone'
import { HealthBanner } from './HealthBanner'
import { TopBar } from './TopBar'

export function AppShell() {
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <HealthBanner />
      <div className="flex min-h-0 flex-1">
        <aside aria-label="Graphs" className="bg-card w-64 shrink-0 overflow-auto border-r p-3.5">
          <UploadDropzone />
          <GraphList />
        </aside>
        <main className="min-w-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
