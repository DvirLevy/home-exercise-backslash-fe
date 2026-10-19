import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Button } from '@/design-system/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/ui/dialog'
import { normalizeError } from '@/services/errors'
import type { GraphRef } from '@/types/api'
import { useDeleteGraph } from '../hooks/useGraphMutations'

type Props = { graph: GraphRef; open: boolean; onOpenChange: (open: boolean) => void }

export function DeleteGraphDialog({ graph, open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const remove = useDeleteGraph(graph.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete "{graph.name}"?</DialogTitle>
          <DialogDescription>
            This permanently removes the graph with its nodes, edges and filters. It cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        {remove.error ? (
          <ErrorAlert
            title="Could not delete the graph"
            message={normalizeError(remove.error).message}
          />
        ) : null}
        <DialogFooter>
          <Button disabled={remove.isPending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            className="bg-destructive hover:bg-destructive/90 text-white dark:text-slate-950"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(undefined, {
                onSuccess: () => {
                  toast.success(`Graph "${graph.name}" deleted`)
                  onOpenChange(false)
                  void navigate('/')
                },
              })
            }
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
