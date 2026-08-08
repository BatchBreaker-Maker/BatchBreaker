'use client'

import { useActionState } from 'react'
import { saveReleaseDecision } from '@/server/release/actions'
import type { FormActionState } from '@/server/batches/actions'
import { Button, Input, Label, Textarea } from '@/components/ui'

export function ReleaseDecisionForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveReleaseDecision, undefined)

  return (
    <form action={formAction} className="flex w-full max-w-lg flex-col gap-4">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <div className="flex flex-col gap-1">
        <Label htmlFor="finishedProductSpecRef">Finished Product Specification # / Version</Label>
        <Input id="finishedProductSpecRef" name="finishedProductSpecRef" required />
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm text-text">
        <input type="checkbox" name="inProcessResultsReviewed" className="h-4 w-4 shrink-0" />
        In-process test results reviewed
      </label>

      <label className="flex min-h-11 items-center gap-2 text-sm text-text">
        <input type="checkbox" name="oosResultsPending" className="h-4 w-4 shrink-0" />
        Any OOS or pending test results (batch must remain Quarantined if checked)
      </label>

      <div className="flex flex-col gap-1">
        <Label htmlFor="decisionBasisRationale">Decision Basis / Rationale</Label>
        <Textarea id="decisionBasisRationale" name="decisionBasisRationale" rows={3} required />
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-text">Decision</legend>
        {(['RELEASED', 'REJECTED', 'QUARANTINED'] as const).map((value) => (
          <label key={value} className="flex min-h-11 items-center gap-2 text-sm text-text">
            <input type="radio" name="decision" value={value} required />
            {value.charAt(0) + value.slice(1).toLowerCase()}
          </label>
        ))}
      </fieldset>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Saving…' : 'Save release decision'}
      </Button>
    </form>
  )
}
