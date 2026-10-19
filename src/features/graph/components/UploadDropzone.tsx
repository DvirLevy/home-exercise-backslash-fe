import { Upload } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { UploadDialog } from './UploadDialog'
import { checkGraphFile, type CheckedFile } from '../utils/fileCheck'

export function UploadDropzone() {
  const [dragging, setDragging] = useState(false)
  const [open, setOpen] = useState(false)
  const [initial, setInitial] = useState<CheckedFile | null>(null)

  async function openWith(chosen: File | null) {
    setInitial(chosen ? { file: chosen, result: await checkGraphFile(chosen) } : null)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openWith(null)}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void openWith(e.dataTransfer.files[0] ?? null)
        }}
        className={cn(
          'bg-muted text-muted-foreground hover:border-primary w-full rounded-lg border-2 border-dashed px-3 py-4 text-center transition-colors',
          dragging && 'border-primary bg-accent',
        )}
      >
        <Upload className="mx-auto mb-1 size-4" aria-hidden />
        <strong className="text-foreground block">Upload a graph</strong>
        Drop a .json file or browse
        <span className="mt-0.5 block text-xs">up to 10 MB</span>
      </button>
      <UploadDialog
        open={open}
        onOpenChange={setOpen}
        target={{ kind: 'create' }}
        initial={initial}
      />
    </>
  )
}
