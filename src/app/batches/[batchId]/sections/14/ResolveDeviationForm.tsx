'use client'

import { useActionState } from 'react'
import { resolveDeviation } from '@/server/deviations/actions'
import type { FormActionState } from '@/server/batches/actions'

export function ResolveDeviationForm({ batchRecordId, deviationId }: { batchRecordId: string; deviationId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(resolveDeviation, undefined)
  const inputClass = 'rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900'

  return (
    <form action={formAction} className="flex flex-col gap-2 mt-2">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <input type="hidden" name="deviationId" value={deviationId} />
      <textarea
        name="resolutionRationale"
        rows={2}
        placeholder="Documented rationale for resolving this deviation…"
        className={inputClass}
        required
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded border border-zinc-400 px-3 py-1 text-sm font-medium disabled:opacity-50 dark:border-zinc-600"
      >
        {pending ? 'Resolving…' : 'Resolve (QC)'}
      </button>
    </form>
  )
}
