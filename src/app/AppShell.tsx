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
      <div className="flex min-h-0 flex-1 flex-col overflow-auto min-[1100px]:flex-row min-[1100px]:overflow-hidden">
        <aside
          aria-label="Graphs"
          className="bg-card max-h-[40vh] w-full shrink-0 overflow-auto border-b p-3.5 min-[1100px]:max-h-none min-[1100px]:w-64 min-[1100px]:border-r min-[1100px]:border-b-0"
        >
          <UploadDropzone />
          <GraphList />
        </aside>
        <main className="min-w-0 min-[1100px]:flex-1 min-[1100px]:overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
