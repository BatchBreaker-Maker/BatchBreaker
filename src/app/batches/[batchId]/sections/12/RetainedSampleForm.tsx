'use client'

import { useActionState } from 'react'
import { saveRetainedSampleRecord } from '@/server/retainedSample/actions'
import type { FormActionState } from '@/server/batches/actions'
import type { RetainedSampleRecordModel } from '@/generated/prisma/models'

export function RetainedSampleForm({ batchRecordId, existing }: { batchRecordId: string; existing: RetainedSampleRecordModel | null }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveRetainedSampleRecord, undefined)
  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-lg">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="unitsCollected">Units Collected (min. 2)</label>
          <input id="unitsCollected" name="unitsCollected" type="number" min="2" defaultValue={existing?.unitsCollected ?? 2} className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="dateCollected">Date Collected</label>
          <input
            id="dateCollected"
            name="dateCollected"
            type="date"
            defaultValue={existing?.dateCollected ? existing.dateCollected.toISOString().slice(0, 10) : ''}
            className={inputClass}
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="sampleLabelApplied" defaultChecked={existing?.sampleLabelApplied ?? false} className="h-4 w-4" />
        Sample label applied
      </label>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="storageLocation">Storage Location</label>
        <input id="storageLocation" name="storageLocation" defaultValue={existing?.storageLocation ?? ''} className={inputClass} required />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="minimumRetentionPeriod">Minimum Retention Period</label>
        <input id="minimumRetentionPeriod" name="minimumRetentionPeriod" defaultValue={existing?.minimumRetentionPeriod ?? ''} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="scheduledDestructionReviewDate">Scheduled Destruction / Review Date</label>
        <input
          id="scheduledDestructionReviewDate"
          name="scheduledDestructionReviewDate"
          type="date"
          defaultValue={existing?.scheduledDestructionReviewDate ? existing.scheduledDestructionReviewDate.toISOString().slice(0, 10) : ''}
          className={inputClass}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={2} defaultValue={existing?.notes ?? ''} className={inputClass} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
