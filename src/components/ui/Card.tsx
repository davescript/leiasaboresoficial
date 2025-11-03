import { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('rounded-xl bg-white shadow-soft border border-amber-100', className)}>{children}</div>
)