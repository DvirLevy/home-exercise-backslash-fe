import { Button } from '@/design-system/ui/button'
import { ErrorAlert } from '@/components/ErrorAlert'

type Props = { onReload: () => void; onOverwrite: () => void; busy?: boolean }

export function VersionConflictAlert({ onReload, onOverwrite, busy }: Props) {
  return (
    <ErrorAlert
      variant="warning"
      title="This graph changed since you opened it."
      message="Someone replaced it or edited a filter."
    >
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onReload} disabled={busy}>
          Reload graph
        </Button>
        <Button type="button" size="sm" onClick={onOverwrite} disabled={busy}>
          Overwrite anyway
        </Button>
      </div>
    </ErrorAlert>
  )
}
