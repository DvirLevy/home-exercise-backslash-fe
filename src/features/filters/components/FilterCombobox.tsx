import { Command } from 'cmdk'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/design-system/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/design-system/ui/popover'
import { pluralize } from '@/utils/format'
import type { Filter } from '@/types/api'
import { cn } from '@/utils/cn'

type Props = {
  /** Used in the accessible name, e.g. "Start at". */
  roleLabel: string
  filters: Filter[] | undefined
  /** Filters already chosen for this role: not offered again. */
  taken: string[]
  onPick: (key: string) => void
  className?: string
}

/** Pick one of the graph's filters; each row shows its description and match count. */
export function FilterCombobox({ roleLabel, filters, taken, onPick, className }: Props) {
  const [open, setOpen] = useState(false)
  const available = (filters ?? []).filter((f) => !taken.includes(f.key))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={!filters}
          aria-label={`Add filter to "${roleLabel}"`}
          className={cn(
            'text-muted-foreground hover:bg-muted inline-flex h-[26px] items-center gap-1 rounded-full border border-dashed px-2.5 text-xs font-medium disabled:opacity-50',
            className,
          )}
        >
          <Plus className="size-3" aria-hidden /> add filter
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <Command label={`Search filters for "${roleLabel}"`}>
          <Command.Input
            placeholder="Search filters…"
            className="mb-1 h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm"
          />
          <Command.List className="max-h-64 overflow-auto">
            <Command.Empty className="text-muted-foreground px-2 py-2 text-[13px]">
              No filters left to add.
            </Command.Empty>
            {available.map((f) => {
              const count = f.matchCount
              const unavailable = count === null
              return (
                <Command.Item
                  key={f.key}
                  value={`${f.key} ${f.description ?? ''}`}
                  disabled={unavailable}
                  onSelect={() => {
                    onPick(f.key)
                    setOpen(false)
                  }}
                  className="data-[selected=true]:bg-muted flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[12.5px] font-semibold">{f.key}</div>
                    {f.description ? (
                      <div className="text-muted-foreground text-xs">{f.description}</div>
                    ) : null}
                    {unavailable ? (
                      <div className="text-xs">Its stored rule can no longer be compiled.</div>
                    ) : null}
                  </div>
                  {unavailable ? (
                    <Badge className="text-destructive">unavailable</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {pluralize(count ?? 0, 'node')}
                    </span>
                  )}
                </Command.Item>
              )
            })}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
