import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '../../lib/cn'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export const DialogContent = ({ className, ...props }: DialogPrimitive.DialogContentProps) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/30" />
    <DialogPrimitive.Content className={cn('fixed inset-0 m-auto max-w-lg rounded-xl bg-white p-6 shadow-soft', className)} {...props} />
  </DialogPrimitive.Portal>
)