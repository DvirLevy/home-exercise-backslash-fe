import { Diamond } from 'lucide-react'
import { useState } from 'react'
import { Link, useMatch } from 'react-router'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { DeleteGraphDialog } from '@/features/graph/components/DeleteGraphDialog'
import { RenameDialog } from '@/features/graph/components/RenameDialog'
import { UploadDialog } from '@/features/graph/components/UploadDialog'
import { useGraph } from '@/features/graph/hooks/useGraph'
import { pluralize } from '@/utils/format'
import { HealthIndicator } from './HealthBanner'

function GraphActions({ id }: { id: string }) {
  const { data: graph } = useGraph(id)
  const [dialog, setDialog] = useState<'replace' | 'rename' | 'delete' | null>(null)
  if (!graph) return null
  const close = (open: boolean) => {
    if (!open) setDialog(null)
  }

  return (
    <>
      <span className="text-muted-foreground">/</span>
      <b className="max-w-64 truncate font-semibold">{graph.name}</b>
      <Badge title="Graph version (ETag)">v{graph.version}</Badge>
      <Badge>{pluralize(graph.nodes.length, 'node')}</Badge>
      <Badge>{pluralize(graph.edges.length, 'edge')}</Badge>
      <div className="flex-1" />
      <Button size="sm" onClick={() => setDialog('replace')}>
        Replace file…
      </Button>
      <Button size="sm" onClick={() => setDialog('rename')}>
        Rename
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setDialog('delete')}>
        Delete
      </Button>
      <UploadDialog
        open={dialog === 'replace'}
        onOpenChange={close}
        target={{ kind: 'replace', graph }}
      />
      <RenameDialog graph={graph} open={dialog === 'rename'} onOpenChange={close} />
      <DeleteGraphDialog graph={graph} open={dialog === 'delete'} onOpenChange={close} />
    </>
  )
}

export function TopBar() {
  const match = useMatch('/graphs/:id')
  const id = match?.params.id

  return (
    <header className="bg-card flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <Link to="/" className="flex items-center gap-2 font-semibold">
        <span className="bg-primary text-primary-foreground grid size-6 place-items-center rounded-md">
          <Diamond className="size-3.5" aria-hidden />
        </span>
        Graph Explorer
      </Link>
      {id ? <GraphActions key={id} id={id} /> : <div className="flex-1" />}
      <HealthIndicator />
    </header>
  )
}
