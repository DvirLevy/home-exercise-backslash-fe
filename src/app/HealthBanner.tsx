import { useHealth } from './useHealth'

/** Top-bar status dot and, when the API or its database is down, a banner. */
export function HealthIndicator() {
  const { data, error, isPending } = useHealth()
  const down = Boolean(error) || data?.status === 'unavailable'
  const label = isPending ? 'Checking API…' : down ? 'API offline' : 'API online'
  return (
    <div className="text-muted-foreground flex items-center gap-1.5 text-xs" role="status">
      <span
        aria-hidden
        className={`inline-block size-2 rounded-full ${isPending ? 'bg-muted-foreground' : down ? 'bg-destructive' : 'bg-success'}`}
      />
      {label}
    </div>
  )
}

export function HealthBanner() {
  const { data, error } = useHealth()
  if (error) {
    return (
      <div
        role="alert"
        className="bg-[var(--alert-error-bg)] px-4 py-2 text-[13px] text-[var(--alert-error-fg)]"
      >
        <b>Can't reach the API.</b> Check that the backend is running. Retrying…
      </div>
    )
  }
  if (data?.status === 'unavailable') {
    return (
      <div
        role="alert"
        className="bg-[var(--alert-error-bg)] px-4 py-2 text-[13px] text-[var(--alert-error-fg)]"
      >
        <b>The API is up but its database is down.</b> Retrying…
      </div>
    )
  }
  return null
}
