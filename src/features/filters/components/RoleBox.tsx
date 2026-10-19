import { X } from 'lucide-react'
import { Fragment } from 'react'
import type { Filter, Role } from '@/types/api'
import { cn } from '@/utils/cn'
import { roleColor } from '@/features/visualization/utils/nodeStyling'
import { ROLE_META } from '../utils/roles'
import { FilterCombobox } from './FilterCombobox'

type Props = {
  role: Role
  keys: string[]
  filters: Filter[] | undefined
  onAdd: (key: string) => void
  onRemove: (key: string) => void
}

export function RoleBox({ role, keys, filters, onAdd, onRemove }: Props) {
  const { label } = ROLE_META[role]
  const hintId = `role-hint-${role}`

  return (
    <section aria-label={label} className="mb-2.5 rounded-lg border p-2.5">
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <span aria-hidden className="size-2.5 rounded-sm" style={{ background: roleColor(role) }} />
        {label}
        <span id={hintId} className="text-muted-foreground ml-auto text-[11px] font-normal">
          any of (OR)
        </span>
      </div>
      <ul aria-describedby={hintId} className="flex flex-wrap items-center gap-1.5">
        {keys.map((key, i) => {
          const filter = filters?.find((f) => f.key === key)
          const unknown = filters !== undefined && !filter
          const unavailable = filter?.matchCount === null
          const problem = unknown ? 'not found in this graph' : unavailable ? 'unavailable' : null
          return (
            <Fragment key={key}>
              {i > 0 ? (
                <li aria-hidden className="text-muted-foreground text-[10px] font-bold">
                  OR
                </li>
              ) : null}
              <li
                className={cn(
                  'bg-muted inline-flex h-[26px] items-center gap-1.5 rounded-full border pr-1 pl-2.5 text-xs font-medium',
                  problem && 'border-destructive text-destructive',
                )}
                title={problem ? `${key}: ${problem}` : (filter?.description ?? undefined)}
              >
                <span className="font-mono">{key}</span>
                {problem ? <span className="text-[10px] font-semibold">({problem})</span> : null}
                <button
                  type="button"
                  aria-label={`Remove ${key} from ${label}`}
                  onClick={() => onRemove(key)}
                  className="text-muted-foreground hover:bg-card grid size-4 place-items-center rounded-full"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </li>
            </Fragment>
          )
        })}
        <li>
          <FilterCombobox roleLabel={label} filters={filters} taken={keys} onPick={onAdd} />
        </li>
      </ul>
    </section>
  )
}
