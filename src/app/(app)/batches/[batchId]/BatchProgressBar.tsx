import { ProgressBar } from '@/components/ui'
import type { BatchProgress } from '@/lib/workflow/batchProgress'

export function BatchProgressBar({ progress }: { progress: BatchProgress }) {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2 sm:px-6">
      <span className="shrink-0 text-xs font-medium text-text-muted">Batch Progress</span>
      <ProgressBar value={progress.percent} className="flex-1" />
      <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-text">{progress.percent}%</span>
    </div>
  )
}
