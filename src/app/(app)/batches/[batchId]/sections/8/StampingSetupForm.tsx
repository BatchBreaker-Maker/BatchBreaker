'use client'

import { useActionState } from 'react'
import { saveStampingSetup } from '@/server/stamping/actions'
import type { FormActionState } from '@/server/batches/actions'
import type { StampingSetupModel } from '@/generated/prisma/models'
import { useDefaultDateInput } from '@/lib/dateInputDefaults'
import { Button, Input, Label } from '@/components/ui'

export function StampingSetupForm({
  batchRecordId,
  existing,
}: {
  batchRecordId: string
  existing: StampingSetupModel | null
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveStampingSetup, undefined)
  const defaultSetupDate = useDefaultDateInput()

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="dieStampId">Die / Stamp ID in Use</Label>
          <Input id="dieStampId" name="dieStampId" defaultValue={existing?.dieStampId ?? ''} required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="setupDate">Setup Date</Label>
          <Input
            id="setupDate"
            name="setupDate"
            type="date"
            defaultValue={existing?.setupDate ? existing.setupDate.toISOString().slice(0, 10) : defaultSetupDate}
          />
        </div>
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          name="dieConditionInspected"
          defaultChecked={existing?.dieConditionInspected ?? false}
          className="h-4 w-4 shrink-0"
        />
        Die condition inspected prior to run
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="totalBarsStamped">Total Bars Stamped</Label>
          <Input
            id="totalBarsStamped"
            name="totalBarsStamped"
            type="number"
            min="0"
            defaultValue={existing?.totalBarsStamped ?? ''}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="totalBarsRejected">Total Bars Rejected</Label>
          <Input
            id="totalBarsRejected"
            name="totalBarsRejected"
            type="number"
            min="0"
            defaultValue={existing?.totalBarsRejected ?? ''}
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Saving…' : 'Save setup'}
      </Button>
    </form>
  )
}
