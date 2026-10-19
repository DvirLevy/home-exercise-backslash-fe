import { ErrorAlert } from '@/components/ErrorAlert'
import { Button } from '@/design-system/ui/button'
import { Skeleton } from '@/design-system/ui/skeleton'
import type { ApiError } from '@/services/errors'
import type { Filter } from '@/types/api'
import type { RouteQuery } from '@/types/ui'
import type { Role } from '@/types/api'
import { isQueryEmpty } from '../utils/routeQuery'
import { ROLES } from '../utils/roles'
import { RoleBox } from './RoleBox'

type Props = {
  query: RouteQuery
  filters: Filter[] | undefined
  filtersLoading: boolean
  filtersError: ApiError | null
  routeError: ApiError | null
  onAdd: (role: Role, key: string) => void
  onRemove: (role: Role, key: string) => void
  onClear: () => void
}

export function RouteQueryPanel({
  query,
  filters,
  filtersLoading,
  filtersError,
  routeError,
  onAdd,
  onRemove,
  onClear,
}: Props) {
  return (
    <section aria-label="Route query">
      <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs font-semibold tracking-wide uppercase">
        Find routes
        <Button variant="ghost" size="sm" disabled={isQueryEmpty(query)} onClick={onClear}>
          Clear
        </Button>
      </div>

      {filtersLoading ? (
        <div aria-label="Loading filters" className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        ROLES.map((role) => (
          <RoleBox
            key={role}
            role={role}
            keys={query[role]}
            filters={filters}
            onAdd={(key) => onAdd(role, key)}
            onRemove={(key) => onRemove(role, key)}
          />
        ))
      )}

      {filtersError ? (
        <ErrorAlert title="Could not load the filters" message={filtersError.message} />
      ) : null}
      {routeError ? (
        <div className="mb-2">
          <ErrorAlert
            title={
              routeError.code === 'FILTER_UNAVAILABLE'
                ? 'A filter in this query is unavailable'
                : routeError.code === 'UNKNOWN_FILTER'
                  ? 'This query uses a filter the graph does not have'
                  : 'Could not run the route query'
            }
            message={routeError.message}
            details={routeError.details}
            variant="warning"
          />
        </div>
      ) : null}

      <p className="text-muted-foreground text-xs">
        All three roles must hold (AND). A role left empty is unconstrained. The query lives in the
        URL, so it can be shared.
      </p>
    </section>
  )
}
