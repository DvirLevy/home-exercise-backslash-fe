import { NavLink } from 'react-router'
import { ErrorAlert } from '@/components/ErrorAlert'
import { Badge } from '@/design-system/ui/badge'
import { Skeleton } from '@/design-system/ui/skeleton'
import { normalizeError } from '@/services/errors'
import { cn } from '@/utils/cn'
import { formatRelativeTime, pluralize } from '@/utils/format'
import { useGraphs } from '../hooks/useGraphs'

export function GraphList() {
  const { data, isPending, error } = useGraphs()

  if (isPending && !error) {
    return (
      <div aria-label="Loading graphs" className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1.5 px-2.5">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorAlert title="Could not load the graphs" message={normalizeError(error).message} />
  }

  if (!data || data.length === 0) {
    return <p className="text-muted-foreground px-1 text-[13px]">No graphs yet.</p>
  }

  return (
    <>
      <div className="text-muted-foreground mt-4 mb-2 flex items-center justify-between text-xs font-semibold tracking-wide uppercase">
        Graphs <Badge>{data.length}</Badge>
      </div>
      <ul className="space-y-1">
        {data.map((g) => (
          <li key={g.id}>
            <NavLink
              to={`/graphs/${g.id}`}
              className={({ isActive }) =>
                cn(
                  'hover:bg-muted block rounded-lg px-2.5 py-2',
                  isActive && 'bg-accent outline-primary/40 outline outline-1',
                )
              }
            >
              <div className="font-semibold">{g.name}</div>
              <div className="text-muted-foreground text-xs">
                {pluralize(g.nodeCount, 'node')} · {pluralize(g.edgeCount, 'edge')} · v{g.version} ·{' '}
                {formatRelativeTime(g.updatedAt)}
              </div>
            </NavLink>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-2.5 text-xs">
        Names need not be unique; items show counts and dates to tell them apart.
      </p>
    </>
  )
}
