interface ProgressBarProps {
  value: number
  className?: string
}

function colorForValue(value: number): string {
  if (value >= 100) return 'bg-success'
  if (value >= 34) return 'bg-warning'
  return 'bg-danger'
}

export function ProgressBar({ value, className = '' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-2 w-full overflow-hidden rounded-full bg-surface-hover ${className}`}
    >
      <div
        style={{ width: `${clamped}%` }}
        className={`h-full rounded-full transition-[width] duration-300 ${colorForValue(clamped)}`}
      />
    </div>
  )
}
