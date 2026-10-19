import { Handle, Position, useStore, type NodeProps } from '@xyflow/react'
import { Globe } from 'lucide-react'
import { pluralize } from '@/utils/format'
import { Badge } from '@/design-system/ui/badge'
import { cn } from '@/utils/cn'
import type { FlowNode } from '../utils/graphToFlow'
import { kindColor, primaryRole, roleColor, vulnerabilitySummary } from '../utils/nodeStyling'
import { RoleTag } from './RoleTag'
import { SeverityBadge } from './SeverityBadge'

/** Below this zoom the card shrinks to a name plate: the detail would be unreadable anyway. */
export const COMPACT_ZOOM = 0.5

const hiddenHandle = { opacity: 0, pointerEvents: 'none' } as const

export function GraphNodeCard({ data, selected }: NodeProps<FlowNode>) {
  const compact = useStore((s) => s.transform[2] < COMPACT_ZOOM)
  const { node, roles, dimmed } = data
  const role = primaryRole(roles)
  const vulns = vulnerabilitySummary(node)

  const subtitle = node.placeholder
    ? 'placeholder · not defined in the file'
    : [node.kind, node.language].filter(Boolean).join(' · ')

  return (
    <div
      data-testid={`node-${node.name}`}
      data-placeholder={node.placeholder || undefined}
      data-role={role ?? undefined}
      className={cn(
        'bg-card relative w-44 rounded-lg border px-2.5 py-2 shadow-sm',
        node.placeholder
          ? 'border-placeholder bg-muted border-[1.5px] border-dashed'
          : 'border-l-4',
        dimmed && 'opacity-[var(--dimmed)]',
        selected && 'outline-primary outline-2 outline-offset-3',
      )}
      style={{
        borderLeftColor: node.placeholder ? undefined : kindColor(node.kind),
        boxShadow: role ? `0 0 0 2px ${roleColor(role)}` : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} style={hiddenHandle} />
      <Handle type="source" position={Position.Right} isConnectable={false} style={hiddenHandle} />

      {role ? <RoleTag role={role} className="absolute -top-2.5 right-2" /> : null}

      <div
        className={cn(
          'truncate text-[13px] font-semibold',
          node.placeholder && 'text-muted-foreground italic',
        )}
      >
        {node.name}
      </div>

      {compact ? null : (
        <>
          <div className="text-muted-foreground mt-0.5 truncate text-[11px]">{subtitle}</div>
          {node.publicExposed || vulns ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {node.publicExposed ? (
                <Badge>
                  <Globe className="size-3" aria-hidden /> Public
                </Badge>
              ) : null}
              {vulns ? (
                <SeverityBadge severity={vulns.highest}>
                  {pluralize(vulns.count, 'vuln')} · {vulns.highest ?? 'unknown'}
                </SeverityBadge>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
