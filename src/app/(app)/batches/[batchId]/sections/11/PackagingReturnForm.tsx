'use client'

import { useActionState } from 'react'
import { savePackagingReturn } from '@/server/packaging/actions'
import type { FormActionState } from '@/server/batches/actions'
import type { PackagingReturnModel } from '@/generated/prisma/models'
import { Button, Card, Input, Label } from '@/components/ui'

export function PackagingReturnForm({ batchRecordId, existing }: { batchRecordId: string; existing: PackagingReturnModel | null }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(savePackagingReturn, undefined)

  return (
    <Card className="w-full max-w-lg">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium text-text">Unused packaging returned to store?</legend>
          {(['YES', 'NO', 'NA'] as const).map((v) => (
            <label
              key={v}
              className="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm text-text hover:bg-surface-hover"
            >
              <input
                type="radio"
                name="returned"
                value={v}
                defaultChecked={existing?.returned === v}
                required
                className="h-4 w-4 shrink-0"
              />
              {v}
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-1">
          <Label htmlFor="quantitiesReturned">Quantities Returned (describe)</Label>
          <Input id="quantitiesReturned" name="quantitiesReturned" defaultValue={existing?.quantitiesReturned ?? ''} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="returnedDate">Returned Date</Label>
          <Input
            id="returnedDate"
            name="returnedDate"
            type="date"
            defaultValue={existing?.returnedDate ? existing.returnedDate.toISOString().slice(0, 10) : ''}
          />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </Card>
  )
}
