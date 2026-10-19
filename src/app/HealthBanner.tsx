import { useHealth } from './useHealth'

/** A banner shown only while the API or its database is down; it keeps retrying in the background. */
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
