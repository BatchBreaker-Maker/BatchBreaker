'use client'

import { useActionState } from 'react'
import { saveStampingSetup } from '@/server/stamping/actions'
import type { FormActionState } from '@/server/batches/actions'
import type { StampingSetupModel } from '@/generated/prisma/models'

export function StampingSetupForm({ batchRecordId, existing }: { batchRecordId: string; existing: StampingSetupModel | null }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveStampingSetup, undefined)
  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="dieStampId">Die / Stamp ID in Use</label>
          <input id="dieStampId" name="dieStampId" defaultValue={existing?.dieStampId ?? ''} className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="setupDate">Setup Date</label>
          <input
            id="setupDate"
            name="setupDate"
            type="date"
            defaultValue={existing?.setupDate ? existing.setupDate.toISOString().slice(0, 10) : ''}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="dieConditionInspected" defaultChecked={existing?.dieConditionInspected ?? false} className="h-4 w-4" />
        Die condition inspected prior to run
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="totalBarsStamped">Total Bars Stamped</label>
          <input
            id="totalBarsStamped"
            name="totalBarsStamped"
            type="number"
            min="0"
            defaultValue={existing?.totalBarsStamped ?? ''}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="totalBarsRejected">Total Bars Rejected</label>
          <input
            id="totalBarsRejected"
            name="totalBarsRejected"
            type="number"
            min="0"
            defaultValue={existing?.totalBarsRejected ?? ''}
            className={inputClass}
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save setup'}
      </button>
    </form>
  )
}
