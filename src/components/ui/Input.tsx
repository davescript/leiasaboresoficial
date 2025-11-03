import { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export const Input = ({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn('w-full rounded-md border border-amber-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300', className)} {...rest} />
)