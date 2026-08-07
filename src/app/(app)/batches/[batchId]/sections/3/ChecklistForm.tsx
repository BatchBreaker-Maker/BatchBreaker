'use client'

import { useActionState } from 'react'
import { updateChecklist } from '@/server/checklist/actions'
import type { FormActionState } from '@/server/batches/actions'
import { CHECKLIST_ITEM_LABELS, CHECKLIST_ITEM_ORDER } from '@/lib/workflow/checklistItems'
import type { ChecklistItemKey } from '@/generated/prisma/enums'

export function ChecklistForm({
  batchRecordId,
  verifiedItems,
}: {
  batchRecordId: string
  verifiedItems: Set<ChecklistItemKey>
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(updateChecklist, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-3 w-full max-w-2xl">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      {CHECKLIST_ITEM_ORDER.map((key) => (
        <label key={key} className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name={key}
            defaultChecked={verifiedItems.has(key)}
            className="mt-1 h-4 w-4"
          />
          <span>{CHECKLIST_ITEM_LABELS[key]}</span>
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
