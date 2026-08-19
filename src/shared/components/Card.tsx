import { cn } from '@/shared/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  variant?: 'default' | 'warning' | 'danger'
  padding?: 'sm' | 'md' | 'lg'
  className?: string
}

const paddingMap = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const variantMap = {
  default: 'border-border bg-card',
  warning: 'border-warning/30 bg-warning/5',
  danger: 'border-danger/30 bg-danger/5',
}

export function Card({ children, variant = 'default', padding = 'md', className }: CardProps) {
  return (
    <div className={cn('rounded-2xl border', paddingMap[padding], variantMap[variant], className)}>
      {children}
    </div>
  )
}
