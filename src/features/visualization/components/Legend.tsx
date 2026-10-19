import type { Role } from '@/types/api'
import { cn } from '@/utils/cn'
import { KIND_LABEL, ROLE_LABEL, type KindGroup, kindColor, roleColor } from '../utils/nodeStyling'

const KIND_SAMPLE: Record<KindGroup, string> = {
  service: 'service',
  database: 'rds',
  queue: 'sqs',
  other: 'other',
}

const ROLES: Role[] = ['start', 'through', 'end']

function Item({
  swatch,
  label,
  title,
}: {
  swatch: React.ReactNode
  label: string
  title?: string
}) {
  return (
    <div className="flex items-center gap-1.5" title={title}>
      {swatch}
      {label}
    </div>
  )
}

/** Compact two-column legend; the longer descriptions are in the tooltips. */
export function Legend({ showRoles = false }: { showRoles?: boolean }) {
  return (
    <div
      className={cn(
        'bg-card grid w-max grid-cols-2 gap-x-4 gap-y-0.5 rounded-lg border px-2 py-1.5 text-[11px]',
      )}
      aria-label="Legend"
      role="group"
    >
      {(Object.keys(KIND_LABEL) as KindGroup[]).map((group) => (
        <Item
          key={group}
          label={KIND_LABEL[group].replace(/ \(.*\)$/, '')}
          title={KIND_LABEL[group]}
          swatch={
            <i
              aria-hidden
              className="inline-block h-3 w-1 rounded-sm"
              style={{ background: kindColor(KIND_SAMPLE[group]) }}
            />
          }
        />
      ))}
      {showRoles
        ? ROLES.map((role) => (
            <Item
              key={role}
              label={ROLE_LABEL[role][0] + ROLE_LABEL[role].slice(1).toLowerCase()}
              swatch={
                <i
                  aria-hidden
                  className="inline-block size-2.5 rounded-sm"
                  style={{ background: roleColor(role) }}
                />
              }
            />
          ))
        : null}
      {showRoles ? (
        <Item
          label="Off route"
          title="Not on a route"
          swatch={
            <i
              aria-hidden
              className="bg-muted-foreground/40 inline-block size-2.5 rounded-sm opacity-50"
            />
          }
        />
      ) : null}
      <Item
        label="Placeholder"
        title="Placeholder (not defined in the file)"
        swatch={
          <i
            aria-hidden
            className="border-placeholder bg-muted inline-block size-2.5 rounded-sm border border-dashed"
          />
        }
      />
    </div>
  )
}
