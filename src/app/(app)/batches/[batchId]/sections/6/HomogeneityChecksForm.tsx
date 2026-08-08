'use client'

import { useActionState } from 'react'
import { saveHomogeneityChecks } from '@/server/inProcess/actions'
import type { FormActionState } from '@/server/batches/actions'
import { HOMOGENEITY_ITEM_LABELS, HOMOGENEITY_ITEM_ORDER } from '@/lib/workflow/inProcessLabels'
import { Button, Input } from '@/components/ui'

export function HomogeneityChecksForm({
  batchRecordId,
  existing,
}: {
  batchRecordId: string
  existing: Record<string, { result: string | null; comments: string | null }>
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveHomogeneityChecks, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      {HOMOGENEITY_ITEM_ORDER.map((key) => (
        <div key={key} className="flex flex-col gap-1 border-b border-border pb-2 last:border-0">
          <span className="text-sm text-text">{HOMOGENEITY_ITEM_LABELS[key]}</span>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1 text-sm text-text">
              <input type="radio" name={`result_${key}`} value="PASS" defaultChecked={existing[key]?.result === 'PASS'} /> Pass
            </label>
            <label className="flex items-center gap-1 text-sm text-text">
              <input type="radio" name={`result_${key}`} value="FAIL" defaultChecked={existing[key]?.result === 'FAIL'} /> Fail
            </label>
            <Input
              type="text"
              name={`comments_${key}`}
              placeholder="Comments"
              defaultValue={existing[key]?.comments ?? ''}
              className="flex-1"
            />
          </div>
        </div>
      ))}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Saving…' : 'Save checks'}
      </Button>
    </form>
  )
}
