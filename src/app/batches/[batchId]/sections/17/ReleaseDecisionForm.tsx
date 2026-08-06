'use client'

import { useActionState } from 'react'
import { saveReleaseDecision } from '@/server/release/actions'
import type { FormActionState } from '@/server/batches/actions'

export function ReleaseDecisionForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveReleaseDecision, undefined)
  const inputClass = 'rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900'

  return (
    <form action={formAction} className="flex flex-col gap-4 w-full max-w-lg">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="finishedProductSpecRef">
          Finished Product Specification # / Version
        </label>
        <input id="finishedProductSpecRef" name="finishedProductSpecRef" className={inputClass} required />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="inProcessResultsReviewed" className="h-4 w-4" />
        In-process test results reviewed
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="oosResultsPending" className="h-4 w-4" />
        Any OOS or pending test results (batch must remain Quarantined if checked)
      </label>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="decisionBasisRationale">Decision Basis / Rationale</label>
        <textarea id="decisionBasisRationale" name="decisionBasisRationale" rows={3} className={inputClass} required />
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">Decision</legend>
        {(['RELEASED', 'REJECTED', 'QUARANTINED'] as const).map((value) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input type="radio" name="decision" value={value} required />
            {value.charAt(0) + value.slice(1).toLowerCase()}
          </label>
        ))}
      </fieldset>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save release decision'}
      </button>
    </form>
  )
}
