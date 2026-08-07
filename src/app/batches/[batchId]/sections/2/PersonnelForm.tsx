'use client'

import { useActionState } from 'react'
import { assignBatchPersonnel, type FormActionState } from '@/server/batches/actions'

export function PersonnelForm({
  batchRecordId,
  current,
}: {
  batchRecordId: string
  current: { productionOperatorNames: string[]; headOfProductionName: string | null; qcReviewerName: string | null }
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(assignBatchPersonnel, undefined)
  const inputClass = 'rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-4 w-full max-w-md">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="productionOperatorNames">Production Operator(s)</label>
        <textarea
          id="productionOperatorNames"
          name="productionOperatorNames"
          rows={3}
          placeholder="One name per line"
          defaultValue={(current.productionOperatorNames ?? []).join('\n')}
          className={inputClass}
          required
        />
        <p className="text-xs text-zinc-500">Enter one name per line — any number of operators can be listed.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="headOfProductionName">Head of Production</label>
        <input
          id="headOfProductionName"
          name="headOfProductionName"
          defaultValue={current.headOfProductionName ?? ''}
          className={inputClass}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="qcReviewerName">QC Reviewer</label>
        <input
          id="qcReviewerName"
          name="qcReviewerName"
          defaultValue={current.qcReviewerName ?? ''}
          className={inputClass}
          required
        />
        <p className="text-xs text-zinc-500">Must be a different person than the operator(s) or Head of Production.</p>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save personnel'}
      </button>
    </form>
  )
}
