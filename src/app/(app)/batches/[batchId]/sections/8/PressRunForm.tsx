'use client'

import { useActionState } from 'react'
import { addPressRun } from '@/server/stamping/actions'
import type { FormActionState } from '@/server/batches/actions'
import { useDefaultDateTimeLocal } from '@/lib/dateInputDefaults'
import { Button, Card, Input, Label } from '@/components/ui'

export function PressRunForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addPressRun, undefined)
  const defaultDateTime = useDefaultDateTimeLocal()

  return (
    <Card className="w-full max-w-2xl">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />
        <h3 className="text-sm font-semibold text-text">Add press log entry</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="dateTime">Date/Time</Label>
            <Input id="dateTime" name="dateTime" type="datetime-local" defaultValue={defaultDateTime} required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="pressRunDieStampId">Die / Stamp ID</Label>
            <Input id="pressRunDieStampId" name="dieStampId" required />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="impressionQuality">Impression Quality</Label>
            <Input id="impressionQuality" name="impressionQuality" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="barSurfaceCondition">Bar Surface Condition</Label>
            <Input id="barSurfaceCondition" name="barSurfaceCondition" />
          </div>
        </div>

        <label className="flex min-h-11 items-center gap-2 text-sm text-text">
          <input type="checkbox" name="appearanceOk" defaultChecked className="h-4 w-4 shrink-0" />
          Appearance OK
        </label>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Adding…' : 'Add run'}
        </Button>
      </form>
    </Card>
  )
}
