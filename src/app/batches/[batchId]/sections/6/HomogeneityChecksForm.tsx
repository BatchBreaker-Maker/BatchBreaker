'use client'

import { useActionState } from 'react'
import { saveHomogeneityChecks } from '@/server/inProcess/actions'
import type { FormActionState } from '@/server/batches/actions'
import { HOMOGENEITY_ITEM_LABELS, HOMOGENEITY_ITEM_ORDER } from '@/lib/workflow/inProcessLabels'

export function HomogeneityChecksForm({
  batchRecordId,
  existing,
}: {
  batchRecordId: string
  existing: Record<string, { result: string | null; comments: string | null }>
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveHomogeneityChecks, undefined)
  const inputClass = 'rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900'

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      {HOMOGENEITY_ITEM_ORDER.map((key) => (
        <div key={key} className="flex flex-col gap-1 border-b border-zinc-100 pb-2 dark:border-zinc-900">
          <span className="text-sm">{HOMOGENEITY_ITEM_LABELS[key]}</span>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1 text-sm">
              <input type="radio" name={`result_${key}`} value="PASS" defaultChecked={existing[key]?.result === 'PASS'} /> Pass
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input type="radio" name={`result_${key}`} value="FAIL" defaultChecked={existing[key]?.result === 'FAIL'} /> Fail
            </label>
            <input
              type="text"
              name={`comments_${key}`}
              placeholder="Comments"
              defaultValue={existing[key]?.comments ?? ''}
              className={`${inputClass} flex-1`}
            />
          </div>
        </div>
      ))}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save checks'}
      </button>
    </form>
  )
}
