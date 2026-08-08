'use client'

import { useActionState } from 'react'
import { resolveDeviation } from '@/server/deviations/actions'
import type { FormActionState } from '@/server/batches/actions'
import { Button, Textarea } from '@/components/ui'

export function ResolveDeviationForm({ batchRecordId, deviationId }: { batchRecordId: string; deviationId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(resolveDeviation, undefined)

  return (
    <form action={formAction} className="flex w-full max-w-xs flex-col gap-2">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <input type="hidden" name="deviationId" value={deviationId} />
      <Textarea
        name="resolutionRationale"
        rows={2}
        placeholder="Documented rationale for resolving this deviation…"
        required
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        {pending ? 'Resolving…' : 'Resolve (QC)'}
      </Button>
    </form>
  )
}
