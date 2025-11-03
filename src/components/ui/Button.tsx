import { Slot } from '@radix-ui/react-slot'
import { cn } from '../../lib/cn'
import { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
}

export const Button = ({ asChild, variant = 'primary', className, ...rest }: Props) => {
  const Comp: any = asChild ? Slot : 'button'
  const styles = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white',
    secondary: 'bg-amber-100 hover:bg-amber-200 text-brand-700',
    ghost: 'hover:bg-amber-100',
  }[variant]
  return <Comp className={cn('rounded-md px-4 py-2 text-sm transition', styles, className)} {...rest} />
}