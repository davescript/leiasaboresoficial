import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '../../lib/cn'

// Simple Sheet built over Radix Dialog (like shadcn)
export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close
export const SheetContent = ({ side = 'right', className, ...props }: { side?: 'left'|'right'|'top'|'bottom' } & DialogPrimitive.DialogContentProps) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/30" />
    <DialogPrimitive.Content className={cn('fixed bg-white shadow-soft p-6',
      side === 'right' && 'top-0 right-0 h-full w-80 rounded-l-xl',
      side === 'left' && 'top-0 left-0 h-full w-80 rounded-r-xl',
      side === 'top' && 'top-0 left-0 w-full h-80 rounded-b-xl',
      side === 'bottom' && 'bottom-0 left-0 w-full h-80 rounded-t-xl',
      className)} {...props} />
  </DialogPrimitive.Portal>
)