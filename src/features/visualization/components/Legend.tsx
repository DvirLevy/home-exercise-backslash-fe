import { KIND_LABEL, type KindGroup, kindColor } from '../utils/nodeStyling'

const KIND_SAMPLE: Record<KindGroup, string> = {
  service: 'service',
  database: 'rds',
  queue: 'sqs',
  other: 'other',
}

export function Legend() {
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
