import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
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
import { Input } from '@/design-system/ui/input'
import { Label } from '@/design-system/ui/label'
import { Progress } from '@/design-system/ui/progress'
import { normalizeError } from '@/services/errors'
import { queryKeys } from '@/services/queryKeys'
import type { GraphRef } from '@/types/api'
import { formatBytes } from '@/utils/format'
import { useReplaceGraph, useUploadGraph } from '../hooks/useGraphMutations'
import { checkGraphFile, type CheckedFile } from '../utils/fileCheck'
import { notifyUploaded } from '../utils/notifyUploaded'
import { describeUploadError } from '../utils/uploadError'
import { VersionConflictAlert } from './VersionConflictAlert'

export type UploadTarget = { kind: 'create' } | { kind: 'replace'; graph: GraphRef }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: UploadTarget
  /** A file already picked (and checked) before the dialog opened, e.g. dropped on the sidebar. */
  initial?: CheckedFile | null
}

export function UploadDialog({ open, onOpenChange, target, initial }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Mounted only while open, so every opening starts with a clean form. */}
        {open ? (
          <UploadForm
            target={target}
            initial={initial ?? null}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function UploadForm({
  target,
  initial,
  onDone,
}: {
  target: UploadTarget
  initial: CheckedFile | null
  onDone: () => void
}) {
  const isReplace = target.kind === 'replace'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const create = useUploadGraph()
  const replace = useReplaceGraph(isReplace ? target.graph.id : '')
  const mutation = isReplace ? replace : create

  const initialOk = initial?.result.ok ? initial : null
  const [file, setFile] = useState<File | null>(initialOk?.file ?? null)
  const [name, setName] = useState(
    isReplace ? target.graph.name : initialOk?.result.ok ? initialOk.result.suggestedName : '',
  )
  const [fileError, setFileError] = useState<string | null>(
    initial?.result.ok === false ? initial.result.message : null,
  )
  const [progress, setProgress] = useState(0)
  const [conflict, setConflict] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function chooseFile(chosen: File) {
    const result = await checkGraphFile(chosen)
    if (!result.ok) {
      setFile(null)
      setFileError(result.message)
      return
    }
    setFile(chosen)
    setFileError(null)
    if (!isReplace && name.trim() === '') setName(result.suggestedName)
    mutation.reset()
    setConflict(false)
  }

  function submit(overwrite = false) {
    if (!file) return
    setConflict(false)
    setProgress(0)
    const onProgress = setProgress
    const onError = (error: unknown) => {
      if (normalizeError(error).code === 'VERSION_CONFLICT') setConflict(true)
    }
    if (isReplace) {
      const nameChanged = name.trim() !== target.graph.name
      replace.mutate(
        {
          file,
          onProgress,
          name: nameChanged ? name.trim() : undefined,
          version: overwrite ? undefined : target.graph.version,
        },
        {
          onSuccess: (result) => {
            notifyUploaded(result, 'replaced')
            onDone()
          },
          onError,
        },
      )
    } else {
      create.mutate(
        { file, name: name.trim(), onProgress },
        {
          onSuccess: (result) => {
            notifyUploaded(result, 'uploaded')
            onDone()
            void navigate(`/graphs/${result.id}`)
          },
        },
      )
    }
  }

  function reload() {
    if (!isReplace) return
    void queryClient.invalidateQueries({ queryKey: queryKeys.graph(target.graph.id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.graphs })
    onDone()
  }

  const busy = mutation.isPending
  const canSubmit = file !== null && name.trim().length > 0 && name.trim().length <= 200 && !busy
  const error = mutation.error && !conflict ? describeUploadError(mutation.error) : null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) submit()
      }}
      className="grid gap-4"
    >
      <DialogHeader>
        <DialogTitle>{isReplace ? 'Replace graph file' : 'Upload a graph'}</DialogTitle>
        <DialogDescription>
          {isReplace
            ? 'The new file replaces the nodes and edges. Your filters are kept.'
            : 'Choose a JSON file that describes your services (up to 10 MB).'}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-1.5">
        <Label htmlFor="graph-file">JSON file</Label>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            Choose file…
          </Button>
          <span className="text-muted-foreground min-w-0 truncate text-[13px]">
            {file ? `${file.name} (${formatBytes(file.size)})` : 'No file chosen'}
          </span>
        </div>
        <input
          id="graph-file"
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const chosen = e.target.files?.[0]
            if (chosen) void chooseFile(chosen)
            e.target.value = ''
          }}
        />
        {fileError ? <ErrorAlert title={fileError} /> : null}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="graph-name">Name</Label>
        <Input
          id="graph-name"
          value={name}
          maxLength={200}
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          1 to 200 characters. Names need not be unique.
        </p>
      </div>

      {busy ? (
        <div className="grid gap-1" role="status">
          <Progress value={progress} aria-label="Upload progress" />
          <span className="text-muted-foreground text-xs">Uploading… {progress}%</span>
        </div>
      ) : null}

      {conflict ? (
        <VersionConflictAlert onReload={reload} onOverwrite={() => submit(true)} busy={busy} />
      ) : null}
      {error ? (
        <ErrorAlert title={error.title} message={error.message} details={error.details} />
      ) : null}

      <DialogFooter>
        <Button type="button" disabled={busy} onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="default" disabled={!canSubmit}>
          {isReplace ? 'Replace' : 'Upload'}
        </Button>
      </DialogFooter>
    </form>
  )
}
