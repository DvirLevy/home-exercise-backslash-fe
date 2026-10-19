import { Loader2 } from 'lucide-react'
import type { ViewMode } from '@/types/ui'
import { cn } from '@/utils/cn'

type Props = {
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
  /** The graph is too large to draw whole: Highlight route is unavailable. */
  highlightDisabled: boolean
  summary: { nodes: number; edges: number } | null
  updating: boolean
}

const OPTIONS: { mode: ViewMode; label: string }[] = [
  { mode: 'highlight', label: 'Highlight route' },
  { mode: 'routeOnly', label: 'Route only' },
]

export function CanvasToolbar({ mode, onModeChange, highlightDisabled, summary, updating }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="radiogroup"
        aria-label="View"
        className="bg-card inline-flex overflow-hidden rounded-lg border"
      >
        {OPTIONS.map((option) => {
          const disabled = option.mode === 'highlight' && highlightDisabled
          const checked = mode === option.mode
          return (
            <button
              key={option.mode}
              type="button"
              role="radio"
              aria-checked={checked}
              disabled={disabled}
              title={disabled ? 'The graph is too large to draw whole' : undefined}
              onClick={() => onModeChange(option.mode)}
              className={cn(
                'px-2.5 py-1 text-[13px] disabled:cursor-not-allowed disabled:opacity-50',
                checked ? 'bg-foreground text-background' : 'hover:bg-muted',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {summary ? (
        <span role="status" className="bg-card rounded-full border px-3 py-1 text-[13px]">
          <b>{summary.nodes.toLocaleString('en')}</b> {summary.nodes === 1 ? 'node' : 'nodes'} ·{' '}
          <b>{summary.edges.toLocaleString('en')}</b> {summary.edges === 1 ? 'edge' : 'edges'} on
          matching routes
        </span>
      ) : null}
      {updating ? (
        <span role="status" className="text-muted-foreground flex items-center gap-1 text-xs">
          <Loader2 className="size-3.5 animate-spin" aria-hidden /> Updating route…
        </span>
      ) : null}
    </div>
  )
}
