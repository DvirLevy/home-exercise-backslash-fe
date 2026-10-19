import type { GraphNode, Role } from '@/types/api'

export type KindGroup = 'service' | 'database' | 'queue' | 'other'
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'other'

/** Kinds are free strings: databases are `rds` / `sql`, queues `sqs`, anything else falls back to "other". */
export function kindGroup(kind: string | null): KindGroup {
  switch (kind?.trim().toLowerCase()) {
    case 'service':
      return 'service'
    case 'rds':
    case 'sql':
      return 'database'
    case 'sqs':
      return 'queue'
    default:
      return 'other'
  }
}

const KIND_COLOR: Record<KindGroup, string> = {
  service: 'var(--kind-service)',
  database: 'var(--kind-rds)',
  queue: 'var(--kind-sqs)',
  other: 'var(--kind-other)',
}

export function kindColor(kind: string | null): string {
  return KIND_COLOR[kindGroup(kind)]
}

export const KIND_LABEL: Record<KindGroup, string> = {
  service: 'Service',
  database: 'Database (rds, sql)',
  queue: 'Queue (sqs)',
  other: 'Other kind',
}

/** Severity is free text: match case-insensitively, keep the original text for display. */
export function severityLevel(severity: string | null | undefined): SeverityLevel {
  switch (severity?.trim().toLowerCase()) {
    case 'critical':
      return 'critical'
    case 'high':
      return 'high'
    case 'medium':
      return 'medium'
    case 'low':
      return 'low'
    default:
      return 'other'
  }
}

/** Higher is worse. Unknown severities rank below `low`. */
const SEVERITY_RANK: Record<SeverityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  other: 0,
}

export function severityColor(severity: string | null | undefined): string {
  return `var(--sev-${severityLevel(severity)})`
}

export type Vulnerability = {
  severity: string | null
  message: string | null
  file: string | null
  cwe: string | null
  raw: Record<string, unknown>
}

const text = (value: unknown) => (typeof value === 'string' && value !== '' ? value : null)

/** Vulnerabilities are free-form objects ({ file, severity, message, metadata: { cwe } }, all optional). */
export function parseVulnerability(raw: Record<string, unknown>): Vulnerability {
  const metadata = raw.metadata
  const cwe =
    metadata && typeof metadata === 'object'
      ? text((metadata as Record<string, unknown>).cwe)
      : null
  return {
    severity: text(raw.severity),
    message: text(raw.message),
    file: text(raw.file),
    cwe,
    raw,
  }
}

/** The worst severity text among the vulnerabilities (original spelling), or null when there is none. */
export function highestSeverity(vulnerabilities: Record<string, unknown>[]): string | null {
  let best: { rank: number; text: string | null } | null = null
  for (const v of vulnerabilities) {
    const severity = parseVulnerability(v).severity
    const rank = SEVERITY_RANK[severityLevel(severity)]
    if (best === null || rank > best.rank) best = { rank, text: severity }
  }
  return best?.text ?? null
}

export function vulnerabilitySummary(node: Pick<GraphNode, 'vulnerabilities'>): {
  count: number
  highest: string | null
} | null {
  const count = node.vulnerabilities.length
  return count === 0 ? null : { count, highest: highestSeverity(node.vulnerabilities) }
}

export const ROLE_LABEL: Record<Role, string> = { start: 'START', through: 'THROUGH', end: 'END' }

export function roleColor(role: Role): string {
  return `var(--role-${role})`
}

/** A node can play several roles; the most specific one drives the ring (end > start > through). */
export function primaryRole(roles: Role[]): Role | null {
  for (const role of ['end', 'start', 'through'] as const) if (roles.includes(role)) return role
  return null
}
