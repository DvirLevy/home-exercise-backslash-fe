import { ROLE_LABEL, KIND_LABEL, type KindGroup, kindColor, roleColor } from '../utils/nodeStyling'
import type { Role } from '@/types/api'

const KIND_SAMPLE: Record<KindGroup, string> = {
  service: 'service',
  database: 'rds',
  queue: 'sqs',
  other: 'other',
}

export function Legend({ showRoles = false }: { showRoles?: boolean }) {
  return (
    <div
      className="bg-card grid gap-1 rounded-lg border p-2 text-xs"
      aria-label="Legend"
      role="group"
    >
      {(Object.keys(KIND_LABEL) as KindGroup[]).map((group) => (
        <div key={group} className="flex items-center gap-1.5">
          <i
            aria-hidden
            className="inline-block h-3 w-1 rounded-sm"
            style={{ background: kindColor(KIND_SAMPLE[group]) }}
          />
          {KIND_LABEL[group]}
        </div>
      ))}
      {showRoles
        ? (['start', 'through', 'end'] as Role[]).map((role) => (
            <div key={role} className="flex items-center gap-1.5">
              <i
                aria-hidden
                className="inline-block size-3 rounded-sm"
                style={{ background: roleColor(role) }}
              />
              {ROLE_LABEL[role][0] + ROLE_LABEL[role].slice(1).toLowerCase()}
            </div>
          ))
        : null}
      {showRoles ? (
        <div className="flex items-center gap-1.5">
          <i
            aria-hidden
            className="bg-muted-foreground/40 inline-block size-3 rounded-sm opacity-50"
          />
          Not on a route
        </div>
      ) : null}
      <div className="flex items-center gap-1.5">
        <i
          aria-hidden
          className="border-placeholder bg-muted inline-block h-3 w-3 rounded-sm border border-dashed"
        />
        Placeholder (not defined in the file)
      </div>
    </div>
  )
}
