'use client'

import { useActionState } from 'react'
import { addBatchNote } from '@/server/notes/actions'
import type { FormActionState } from '@/server/batches/actions'
import { Button, Label, Textarea } from '@/components/ui'

export function BatchNoteForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addBatchNote, undefined)

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-2xl flex-col gap-3">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="note">Add a note</Label>
        <Textarea id="note" name="note" rows={3} required />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Adding…' : 'Add note'}
      </Button>
    </form>
  )
}
