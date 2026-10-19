import { useState } from 'react'
import { toast } from 'sonner'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Button } from '@/design-system/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/ui/dialog'
import { Input } from '@/design-system/ui/input'
import { Label } from '@/design-system/ui/label'
import { normalizeError } from '@/services/errors'
import type { GraphRef } from '@/types/api'
import { useRenameGraph } from '../hooks/useGraphMutations'

type Props = { graph: GraphRef; open: boolean; onOpenChange: (open: boolean) => void }

export function RenameDialog({ graph, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? <RenameForm graph={graph} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function RenameForm({ graph, onDone }: { graph: GraphRef; onDone: () => void }) {
  const rename = useRenameGraph(graph.id)
  const [name, setName] = useState(graph.name)
  const trimmed = name.trim()
  const canSave = trimmed.length > 0 && trimmed !== graph.name && !rename.isPending

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSave) return
        rename.mutate(trimmed, {
          onSuccess: () => {
            toast.success(`Renamed to "${trimmed}"`)
            onDone()
          },
        })
      }}
    >
      <DialogHeader>
        <DialogTitle>Rename graph</DialogTitle>
      </DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="rename-input">Name</Label>
        <Input
          id="rename-input"
          value={name}
          maxLength={200}
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {rename.error ? (
        <ErrorAlert
          title="Could not rename the graph"
          message={normalizeError(rename.error).message}
          details={normalizeError(rename.error).details}
        />
      ) : null}
      <DialogFooter>
        <Button type="button" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="default" disabled={!canSave}>
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}
