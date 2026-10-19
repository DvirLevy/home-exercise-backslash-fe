import { Ban } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/design-system/ui/button'
import type { RouteQuery } from '@/types/ui'

type Props = { query: RouteQuery; onClear: () => void }

const Keys = ({ keys }: { keys: string[] }) =>
  keys.map((k, i) => (
    <span key={k}>
      {i > 0 ? ' or ' : ''}
      <code className="bg-muted rounded border px-1 font-mono text-xs">{k}</code>
    </span>
  ))

export function NoRouteState({ query, onClear }: Props) {
  const { start, through, end } = query
  return (
    <EmptyState
      icon={<Ban className="size-5" aria-hidden />}
      title="No route matches"
      action={<Button onClick={onClear}>Clear query</Button>}
    >
      {start.length > 0 || end.length > 0 ? (
        <>
          No path
          {start.length > 0 ? (
            <>
              {' '}
              from <Keys keys={start} />
            </>
          ) : null}
          {through.length > 0 ? (
            <>
              {' '}
              through <Keys keys={through} />
            </>
          ) : null}
          {end.length > 0 ? (
            <>
              {' '}
              to <Keys keys={end} />
            </>
          ) : null}
          .{' '}
        </>
      ) : (
        <>
          No path passes through <Keys keys={through} />.{' '}
        </>
      )}
      Try removing a role.
    </EmptyState>
  )
}
