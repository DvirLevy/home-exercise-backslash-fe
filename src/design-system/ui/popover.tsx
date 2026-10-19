import { Popover as PopoverPrimitive } from 'radix-ui'
import type * as React from 'react'
import { cn } from '@/utils/cn'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger

function PopoverContent({
  className,
  align = 'start',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-card text-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 z-50 w-72 rounded-lg border p-1 shadow-md',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverContent, PopoverTrigger }
