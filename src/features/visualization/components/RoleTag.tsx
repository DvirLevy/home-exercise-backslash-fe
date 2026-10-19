import type { Role } from '@/types/api'
import { cn } from '@/utils/cn'
import { ROLE_LABEL, roleColor } from '../utils/nodeStyling'

/** Text tag for a route role, so the role is never signalled by colour alone. */
export function RoleTag({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        'text-on-solid rounded-full px-1.5 py-px text-[10px] font-bold tracking-wide',
        className,
      )}
      style={{ background: roleColor(role) }}
    >
      {ROLE_LABEL[role]}
    </span>
  )
}
