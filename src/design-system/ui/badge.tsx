import type * as React from 'react'
import { cn } from '@/utils/cn'

function Badge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'bg-muted text-foreground inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[11px] font-semibold whitespace-nowrap',
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
