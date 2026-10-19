import { Badge } from '@/design-system/ui/badge'
import { cn } from '@/utils/cn'
import { severityColor } from '../utils/nodeStyling'

/** Solid badge coloured by severity; shows the original text of the (free-form) severity. */
export function SeverityBadge({
  severity,
  children,
  className,
}: {
  severity: string | null
  children?: React.ReactNode
  className?: string
}) {
  return (
    <Badge
      className={cn('text-on-solid border-transparent', className)}
      style={{ background: severityColor(severity) }}
    >
      {children ?? severity ?? 'unknown'}
    </Badge>
  )
}
