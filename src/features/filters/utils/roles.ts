import type { Role } from '@/types/api'

export const ROLES: Role[] = ['start', 'through', 'end']

export const ROLE_META: Record<Role, { label: string; short: string }> = {
  start: { label: 'Start at', short: 'start' },
  through: { label: 'Pass through', short: 'pass through' },
  end: { label: 'End at', short: 'end' },
}
