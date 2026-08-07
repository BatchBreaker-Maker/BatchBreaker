'use client'

import { useActionState } from 'react'
import { addBatchNote } from '@/server/notes/actions'
import type { FormActionState } from '@/server/batches/actions'

export function BatchNoteForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addBatchNote, undefined)
  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'

  return (
    <form action={formAction} className="flex flex-col gap-3 w-full max-w-lg">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="note">Add a note</label>
        <textarea id="note" name="note" rows={3} className={inputClass} required />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add note'}
      </button>
    </form>
  )
}
