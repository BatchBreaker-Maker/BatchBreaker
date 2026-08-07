'use client'

import { useActionState } from 'react'
import { updateCompletenessReview } from '@/server/completenessReview/actions'
import type { FormActionState } from '@/server/batches/actions'
import { COMPLETENESS_ITEM_LABELS, COMPLETENESS_ITEM_ORDER } from '@/lib/workflow/completenessLabels'
import type { CompletenessReviewItemKey } from '@/generated/prisma/enums'

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
    <form action={formAction} className="flex flex-col gap-3 w-full max-w-2xl">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      {COMPLETENESS_ITEM_ORDER.map((key) => (
        <div key={key} className="flex items-start justify-between gap-3 border-b border-zinc-100 py-2 text-sm dark:border-zinc-900">
          <span>{COMPLETENESS_ITEM_LABELS[key]}</span>
          <div className="flex shrink-0 gap-3">
            <label className="flex items-center gap-1">
              <input type="checkbox" name={`${key}__verified`} defaultChecked={verifiedItems.has(key)} className="h-4 w-4" />
              Verified
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" name={`${key}__na`} defaultChecked={naItems.has(key)} className="h-4 w-4" />
              N/A
            </label>
          </div>
        </div>
      ))}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save review'}
      </button>
    </form>
  )
}
