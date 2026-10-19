import type * as React from 'react'
import { cn } from '@/utils/cn'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div aria-hidden className={cn('bg-muted animate-pulse rounded-md', className)} {...props} />
  )
}

export { Skeleton }
