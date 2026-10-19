import type * as React from 'react'
import { cn } from '@/utils/cn'

function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'bg-card placeholder:text-muted-foreground h-8 w-full min-w-0 rounded-md border border-input px-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
