'use client'

import { useActionState } from 'react'
import { updateChecklist } from '@/server/checklist/actions'
import type { FormActionState } from '@/server/batches/actions'
import { CHECKLIST_ITEM_LABELS, CHECKLIST_ITEM_ORDER } from '@/lib/workflow/checklistItems'
import type { ChecklistItemKey } from '@/generated/prisma/enums'
import { Button } from '@/components/ui'

export function ChecklistForm({
  batchRecordId,
  verifiedItems,
}: {
  batchRecordId: string
  verifiedItems: Set<ChecklistItemKey>
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(updateChecklist, undefined)

  return (
    <form action={formAction} className="flex w-full max-w-2xl flex-col gap-1">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      {CHECKLIST_ITEM_ORDER.map((key) => (
        <label
          key={key}
          className="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm text-text hover:bg-surface-hover"
        >
          <input type="checkbox" name={key} defaultChecked={verifiedItems.has(key)} className="h-4 w-4 shrink-0" />
          <span>{CHECKLIST_ITEM_LABELS[key]}</span>
        </label>
      ))}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? 'Saving…' : 'Save checklist'}
      </Button>
    </form>
  )
}
