import { X } from 'lucide-react'
import { JsonView } from '@/components/JsonView'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import type { GraphNode, Role } from '@/types/api'
import { RoleTag } from './RoleTag'
import { SeverityBadge } from './SeverityBadge'
import { parseVulnerability } from '../utils/nodeStyling'

type Props = {
  node: GraphNode
  /** Roles and filters the node matched in the current route query (task 3). */
  matched?: { roles: Role[]; filters: string[] }
  onClose: () => void
}

const yesNo = (value: boolean | null) => (value === null ? 'Unknown' : value ? 'Yes' : 'No')

export function NodeDetails({ node, matched, onClose }: Props) {
  const vulnerabilities = node.vulnerabilities.map(parseVulnerability)

  return (
    <section aria-label={`Details of ${node.name}`} className="bg-card rounded-lg border p-3">
      <header className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{node.name}</h2>
        {matched?.roles.map((role) => (
          <RoleTag key={role} role={role} />
        ))}
        <Button variant="ghost" size="icon" aria-label="Close details" onClick={onClose}>
          <X />
        </Button>
      </header>

      {node.placeholder ? (
        <p className="text-muted-foreground mt-2 text-[13px]">
          Placeholder: an edge refers to this node, but the uploaded file does not define it.
        </p>
      ) : null}

      <dl className="mt-2.5 grid grid-cols-[88px_1fr] gap-x-2.5 gap-y-1.5 text-[13px]">
        <dt className="text-muted-foreground">Kind</dt>
        <dd>{node.kind ?? '–'}</dd>
        <dt className="text-muted-foreground">Language</dt>
        <dd>{node.language ?? '–'}</dd>
        <dt className="text-muted-foreground">Path</dt>
        <dd>
          {node.path ? (
            <code className="bg-muted rounded border px-1 font-mono text-xs break-all">
              {node.path}
            </code>
          ) : (
            '–'
          )}
        </dd>
        <dt className="text-muted-foreground">Public</dt>
        <dd>{yesNo(node.publicExposed)}</dd>
        {matched ? (
          <>
            <dt className="text-muted-foreground">Matches</dt>
            <dd className="flex flex-wrap gap-1">
              {matched.filters.length > 0
                ? matched.filters.map((f) => <Badge key={f}>{f}</Badge>)
                : '–'}
            </dd>
          </>
        ) : null}
      </dl>

      <h3 className="text-muted-foreground mt-3 mb-1 flex items-center justify-between text-xs font-semibold tracking-wide uppercase">
        Vulnerabilities <Badge>{vulnerabilities.length}</Badge>
      </h3>
      {vulnerabilities.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">None reported.</p>
      ) : (
        <ul className="space-y-2">
          {vulnerabilities.map((v, i) => (
            <li key={i} className="rounded-md border p-2 text-[12.5px]">
              <SeverityBadge severity={v.severity} /> {v.message ?? 'No message'}
              {v.file || v.cwe ? (
                <div className="text-muted-foreground mt-0.5 font-mono text-[11.5px] break-all">
                  {[v.file, v.cwe].filter(Boolean).join(' · ')}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <h3 className="text-muted-foreground mt-3 mb-1 text-xs font-semibold tracking-wide uppercase">
        Metadata
      </h3>
      <JsonView value={node.metadata} />

      <h3 className="text-muted-foreground mt-3 mb-1 text-xs font-semibold tracking-wide uppercase">
        Other fields (extra)
      </h3>
      <JsonView value={node.extra} />
    </section>
  )
}
