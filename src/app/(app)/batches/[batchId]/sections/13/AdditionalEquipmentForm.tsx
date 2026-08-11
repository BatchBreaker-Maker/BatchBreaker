'use client'

import { useActionState } from 'react'
import { addAdditionalEquipmentEntry } from '@/server/equipment/actions'
import type { FormActionState } from '@/server/batches/actions'
import { Button, Card, Input, Label } from '@/components/ui'

export function AdditionalEquipmentForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    addAdditionalEquipmentEntry,
    undefined,
  )

  return (
    <Card className="mx-auto w-full max-w-xl">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />
        <h3 className="text-sm font-semibold text-text">Add additional equipment</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="equipmentName">Equipment Name</Label>
            <Input id="equipmentName" name="equipmentName" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="equipmentNumber">Equipment Number / ID</Label>
            <Input id="equipmentNumber" name="equipmentNumber" />
          </div>
        </div>

        <label className="flex min-h-11 items-center gap-2 text-sm text-text">
          <input type="checkbox" name="cleanedAndVerified" className="h-4 w-4 shrink-0" />
          Cleaned &amp; Verified
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-text">
          <input type="checkbox" name="calibrationCurrent" className="h-4 w-4 shrink-0" />
          Calibration Current
        </label>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Adding…' : 'Add equipment'}
        </Button>
      </form>
    </Card>
  )
}
