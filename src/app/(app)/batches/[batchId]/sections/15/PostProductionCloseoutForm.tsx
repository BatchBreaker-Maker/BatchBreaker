'use client'

import { useActionState, useState } from 'react'
import { savePostProductionCloseout } from '@/server/closeout/actions'
import type { FormActionState } from '@/server/batches/actions'
import type { PostProductionCloseoutModel } from '@/generated/prisma/models'
import { Button, Card, Input, Label } from '@/components/ui'

export function PostProductionCloseoutForm({
  batchRecordId,
  existing,
}: {
  batchRecordId: string
  existing: PostProductionCloseoutModel | null
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(savePostProductionCloseout, undefined)
  const [subcontracted, setSubcontracted] = useState(existing?.stepsSubcontracted ?? false)

  return (
    <Card className="w-full max-w-lg">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />

        <div className="flex flex-col gap-1">
          <Label htmlFor="bulkStorageLocation">Bulk Storage Location</Label>
          <Input
            id="bulkStorageLocation"
            name="bulkStorageLocation"
            defaultValue={existing?.bulkStorageLocation ?? ''}
            required
          />
        </div>

        <label className="flex min-h-11 items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            name="enteredInStoreLog"
            defaultChecked={existing?.enteredInStoreLog ?? false}
            className="h-4 w-4 shrink-0"
          />
          Entered in Store Log
        </label>

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium text-text">Entered in ERP?</legend>
          <div className="flex flex-wrap gap-4">
            {(['YES', 'NO', 'NA'] as const).map((v) => (
              <label key={v} className="flex min-h-11 items-center gap-2 text-sm text-text">
                <input type="radio" name="enteredInErp" value={v} defaultChecked={existing?.enteredInErp === v} required />
                {v}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium text-text">Unused Raw Material Returned?</legend>
          <div className="flex flex-wrap gap-4">
            {(['YES', 'NO', 'NA'] as const).map((v) => (
              <label key={v} className="flex min-h-11 items-center gap-2 text-sm text-text">
                <input
                  type="radio"
                  name="unusedRmReturned"
                  value={v}
                  defaultChecked={existing?.unusedRmReturned === v}
                  required
                />
                {v}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1">
          <Label htmlFor="quantitiesRmReturned">Quantities RM Returned (describe)</Label>
          <Input
            id="quantitiesRmReturned"
            name="quantitiesRmReturned"
            defaultValue={existing?.quantitiesRmReturned ?? ''}
          />
        </div>

        <label className="flex min-h-11 items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            name="stepsSubcontracted"
            checked={subcontracted}
            onChange={(e) => setSubcontracted(e.target.checked)}
            className="h-4 w-4 shrink-0"
          />
          Any steps subcontracted?
        </label>

        {subcontracted && (
          <div className="flex flex-col gap-3 rounded-md border border-border bg-base p-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="subcontractorNameStep">Subcontractor Name / Step</Label>
              <Input
                id="subcontractorNameStep"
                name="subcontractorNameStep"
                defaultValue={existing?.subcontractorNameStep ?? ''}
              />
            </div>
            <label className="flex min-h-11 items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                name="subcontractorRecordAttached"
                defaultChecked={existing?.subcontractorRecordAttached ?? false}
                className="h-4 w-4 shrink-0"
              />
              Subcontractor record attached
            </label>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <Label htmlFor="batchCloseoutDate">Batch Closeout Date</Label>
          <Input
            id="batchCloseoutDate"
            name="batchCloseoutDate"
            type="date"
            defaultValue={existing?.batchCloseoutDate ? existing.batchCloseoutDate.toISOString().slice(0, 10) : ''}
            required
          />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Saving…' : 'Save closeout'}
        </Button>
      </form>
    </Card>
  )
}
