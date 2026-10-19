import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@/utils/cn'

const alertVariants = cva('rounded-md border px-3 py-2.5 text-[13px]', {
  variants: {
    variant: {
      error:
        'border-[var(--alert-error-border)] bg-[var(--alert-error-bg)] text-[var(--alert-error-fg)]',
      warning:
        'border-[var(--alert-warn-border)] bg-[var(--alert-warn-bg)] text-[var(--alert-warn-fg)]',
    },
  },
  defaultVariants: { variant: 'error' },
})

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

export { Alert }
