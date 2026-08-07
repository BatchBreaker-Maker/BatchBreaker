'use client'

import { useActionState } from 'react'
import { saveYieldReconciliation } from '@/server/yield/actions'
import type { FormActionState } from '@/server/batches/actions'
import type { YieldReconciliationModel } from '@/generated/prisma/models'

export function YieldForm({ batchRecordId, existing }: { batchRecordId: string; existing: YieldReconciliationModel | null }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveYieldReconciliation, undefined)
  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-lg">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="expectedYield">Expected Yield</label>
          <input id="expectedYield" name="expectedYield" type="number" step="0.001" defaultValue={existing?.expectedYield?.toString()} className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="expectedYieldUnit">Unit</label>
          <input id="expectedYieldUnit" name="expectedYieldUnit" defaultValue={existing?.expectedYieldUnit ?? ''} className={inputClass} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="actualYield">Actual Yield</label>
          <input id="actualYield" name="actualYield" type="number" step="0.001" defaultValue={existing?.actualYield?.toString()} className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="actualYieldUnit">Unit</label>
          <input id="actualYieldUnit" name="actualYieldUnit" defaultValue={existing?.actualYieldUnit ?? ''} className={inputClass} required />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="varianceAcceptable" defaultChecked={existing?.varianceAcceptable ?? true} className="h-4 w-4" />
        Variance acceptable
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="investigationInitiated" defaultChecked={existing?.investigationInitiated ?? false} className="h-4 w-4" />
        Investigation initiated (required if variance not acceptable)
      </label>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="notesDisposition">Notes / Disposition</label>
        <textarea id="notesDisposition" name="notesDisposition" rows={2} defaultValue={existing?.notesDisposition ?? ''} className={inputClass} />
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
