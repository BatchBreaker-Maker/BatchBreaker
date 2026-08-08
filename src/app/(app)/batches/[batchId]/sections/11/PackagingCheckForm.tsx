'use client'

import { useActionState } from 'react'
import { addPackagingCheck } from '@/server/packaging/actions'
import type { FormActionState } from '@/server/batches/actions'
import { useDefaultDateTimeLocal } from '@/lib/dateInputDefaults'
import { Button, Card, Input, Label, Textarea } from '@/components/ui'

export function PackagingCheckForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addPackagingCheck, undefined)
  const defaultTime = useDefaultDateTimeLocal()

  return (
    <Card className="w-full max-w-lg">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />
        <h3 className="text-sm font-semibold text-text">Add in-process packaging check</h3>

        <div className="flex flex-col gap-1">
          <Label htmlFor="time">Time</Label>
          <Input id="time" name="time" type="datetime-local" defaultValue={defaultTime} required />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex min-h-11 items-center gap-2 text-sm text-text">
            <input type="checkbox" name="componentCorrect" defaultChecked className="h-4 w-4 shrink-0" /> Component correct?
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-text">
            <input type="checkbox" name="labelCorrect" defaultChecked className="h-4 w-4 shrink-0" /> Label correct?
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-text">
            <input type="checkbox" name="appearanceOk" defaultChecked className="h-4 w-4 shrink-0" /> Appearance OK?
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-text">
            <input type="checkbox" name="fillWeightOk" defaultChecked className="h-4 w-4 shrink-0" /> Fill/weight OK?
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Adding…' : 'Add check'}
        </Button>
      </form>
    </Card>
  )
}
