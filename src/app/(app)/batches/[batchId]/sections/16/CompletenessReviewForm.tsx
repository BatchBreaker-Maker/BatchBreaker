'use client'

import { useActionState } from 'react'
import { updateCompletenessReview } from '@/server/completenessReview/actions'
import type { FormActionState } from '@/server/batches/actions'
import { COMPLETENESS_ITEM_LABELS, COMPLETENESS_ITEM_ORDER } from '@/lib/workflow/completenessLabels'
import type { CompletenessReviewItemKey } from '@/generated/prisma/enums'
import { Button } from '@/components/ui'

export function CompletenessReviewForm({
  batchRecordId,
  verifiedItems,
  naItems,
}: {
  batchRecordId: string
  verifiedItems: Set<CompletenessReviewItemKey>
  naItems: Set<CompletenessReviewItemKey>
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(updateCompletenessReview, undefined)

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-2xl flex-col gap-1">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      {COMPLETENESS_ITEM_ORDER.map((key) => (
        <div
          key={key}
          className="flex min-h-11 items-center justify-between gap-3 border-b border-border py-2 text-sm text-text last:border-0"
        >
          <span>{COMPLETENESS_ITEM_LABELS[key]}</span>
          <div className="flex shrink-0 gap-4">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" name={`${key}__verified`} defaultChecked={verifiedItems.has(key)} className="h-4 w-4" />
              Verified
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" name={`${key}__na`} defaultChecked={naItems.has(key)} className="h-4 w-4" />
              N/A
            </label>
          </div>
        </div>
      ))}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? 'Saving…' : 'Save review'}
      </Button>
    </form>
  )
}
