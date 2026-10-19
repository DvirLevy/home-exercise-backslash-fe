import { useEffect, useState } from 'react'

/** True once `active` has been true for `delayMs`; avoids spinners flashing for fast requests. */
export function useDelayedFlag(active: boolean, delayMs = 300): boolean {
  const [elapsed, setElapsed] = useState(false)
  useEffect(() => {
    if (!active) {
      const reset = setTimeout(() => setElapsed(false), 0)
      return () => clearTimeout(reset)
    }
    const timer = setTimeout(() => setElapsed(true), delayMs)
    return () => clearTimeout(timer)
  }, [active, delayMs])
  return active && elapsed
}
