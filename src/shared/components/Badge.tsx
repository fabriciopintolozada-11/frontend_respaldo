import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'
import type { ReactNode } from 'react'

const badgeVariants = cva(
  'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'border-border bg-muted text-muted-foreground',
        primary: 'border-primary/30 bg-primary/15 text-primary',
        success: 'border-success/30 bg-success/15 text-success',
        danger: 'border-danger/30 bg-danger/15 text-danger',
        warning: 'border-warning/30 bg-warning/15 text-warning',
      },
      size: {
        sm: 'text-[9px] px-2 py-0.5',
        md: 'text-[10px] px-2.5 py-0.5',
        lg: 'text-xs px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode
  className?: string
}

export function Badge({ children, variant, size, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {children}
    </span>
  )
}
