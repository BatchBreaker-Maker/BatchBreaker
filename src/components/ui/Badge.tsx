import { type HTMLAttributes } from 'react'

export type BadgeStatus = 'success' | 'warning' | 'danger' | 'neutral' | 'accent'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus
}

const STATUS_CLASSES: Record<BadgeStatus, string> = {
  success: 'border-success/30 bg-success/15 text-success',
  warning: 'border-warning/30 bg-warning/15 text-warning',
  danger: 'border-danger/30 bg-danger/15 text-danger',
  neutral: 'border-neutral/30 bg-neutral/15 text-neutral',
  accent: 'border-accent/30 bg-accent/15 text-accent',
}

export function Badge({ status = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_CLASSES[status]} ${className}`}
      {...props}
    />
  )
}

const DOT_CLASSES: Record<BadgeStatus, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-neutral',
  accent: 'bg-accent',
}

export function StatusDot({ status = 'neutral', className = '' }: { status?: BadgeStatus; className?: string }) {
  return <span aria-hidden="true" className={`inline-block h-2 w-2 shrink-0 rounded-full ${DOT_CLASSES[status]} ${className}`} />
}
