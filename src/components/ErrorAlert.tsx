import type { ReactNode } from 'react'
import { Alert } from '@/design-system/ui/alert'
import type { ApiErrorDetail } from '@/types/api'

type Props = {
  title: string
  message?: string
  details?: ApiErrorDetail[]
  variant?: 'error' | 'warning'
  children?: ReactNode
}

/** Error message plus the server's `details`, each with the path it points at. */
export function ErrorAlert({ title, message, details = [], variant = 'error', children }: Props) {
  return (
    <Alert variant={variant}>
      <p className="font-semibold">{title}</p>
      {message ? <p>{message}</p> : null}
      {details.length > 0 ? (
        <ul className="mt-1 max-h-40 space-y-0.5 overflow-auto">
          {details.map((d, i) => (
            <li key={`${d.path}-${i}`}>
              <code className="font-mono text-xs">{d.path}</code>: {d.message}
            </li>
          ))}
        </ul>
      ) : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </Alert>
  )
}
