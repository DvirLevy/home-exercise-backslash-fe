import type { ReactNode } from 'react'

type Props = { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }

export function EmptyState({ icon, title, children, action }: Props) {
  return (
    <div className="text-muted-foreground flex flex-col items-center px-4 py-8 text-center">
      <div className="bg-muted text-foreground mb-3 grid size-10 place-items-center rounded-full">
        {icon}
      </div>
      <p className="text-foreground mb-1 font-semibold">{title}</p>
      {children ? <p className="max-w-sm">{children}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
