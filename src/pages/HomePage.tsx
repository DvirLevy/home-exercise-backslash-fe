import { Boxes } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { FirstRunState } from '@/features/graph/components/FirstRunState'
import { useGraphs } from '@/features/graph/hooks/useGraphs'

export function HomePage() {
  const { data, isPending } = useGraphs()
  if (isPending) return null
  if (data && data.length === 0) return <FirstRunState />
  return (
    <EmptyState icon={<Boxes className="size-5" aria-hidden />} title="Select a graph">
      Pick a graph from the list, or upload a new one.
    </EmptyState>
  )
}
