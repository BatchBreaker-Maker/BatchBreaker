'use client'

import { useActionState } from 'react'
import { savePrePackagingChecklist } from '@/server/packaging/actions'
import type { FormActionState } from '@/server/batches/actions'
import { PRE_PACKAGING_ITEM_LABELS, PRE_PACKAGING_ITEM_ORDER } from '@/lib/workflow/packagingLabels'
import type { PrePackagingChecklistItemKey } from '@/generated/prisma/enums'

export function PrePackagingChecklistForm({
  batchRecordId,
  verifiedItems,
}: {
  batchRecordId: string
  verifiedItems: Set<PrePackagingChecklistItemKey>
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(savePrePackagingChecklist, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      {PRE_PACKAGING_ITEM_ORDER.map((key) => (
        <label key={key} className="flex items-start gap-3 text-sm">
          <input type="checkbox" name={key} defaultChecked={verifiedItems.has(key)} className="mt-1 h-4 w-4" />
          <span>{PRE_PACKAGING_ITEM_LABELS[key]}</span>
        </label>
      ))}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save checklist'}
      </button>
    </form>
  )
}
