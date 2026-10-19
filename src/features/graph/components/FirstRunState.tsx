import { Upload } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/design-system/ui/button'
import { UploadDialog } from './UploadDialog'

export function FirstRunState() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <EmptyState
        icon={<Upload className="size-5" aria-hidden />}
        title="Upload your first graph"
        action={
          <Button variant="default" onClick={() => setOpen(true)}>
            Choose file
          </Button>
        }
      >
        Drop a JSON file describing your services.
      </EmptyState>
      <UploadDialog open={open} onOpenChange={setOpen} target={{ kind: 'create' }} />
    </>
  )
}
