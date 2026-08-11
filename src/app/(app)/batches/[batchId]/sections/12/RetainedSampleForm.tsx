'use client'

import { useActionState } from 'react'
import { saveRetainedSampleRecord } from '@/server/retainedSample/actions'
import type { FormActionState } from '@/server/batches/actions'
import type { RetainedSampleRecordModel } from '@/generated/prisma/models'
import { useDefaultDateInput } from '@/lib/dateInputDefaults'
import { Button, Card, Input, Label, Textarea } from '@/components/ui'

export function RetainedSampleForm({ batchRecordId, existing }: { batchRecordId: string; existing: RetainedSampleRecordModel | null }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveRetainedSampleRecord, undefined)
  const defaultDateCollected = useDefaultDateInput()

  return (
    <Card className="w-full">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="unitsCollected">Units Collected (min. 2)</Label>
            <Input
              id="unitsCollected"
              name="unitsCollected"
              type="number"
              min="2"
              defaultValue={existing?.unitsCollected ?? 2}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="dateCollected">Date Collected</Label>
            <Input
              id="dateCollected"
              name="dateCollected"
              type="date"
              defaultValue={existing?.dateCollected ? existing.dateCollected.toISOString().slice(0, 10) : defaultDateCollected}
              required
            />
          </div>
        </div>

        <label className="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm text-text hover:bg-surface-hover">
          <input
            type="checkbox"
            name="sampleLabelApplied"
            defaultChecked={existing?.sampleLabelApplied ?? false}
            className="h-4 w-4 shrink-0"
          />
          Sample label applied
        </label>

        <div className="flex flex-col gap-1">
          <Label htmlFor="storageLocation">Storage Location</Label>
          <Input id="storageLocation" name="storageLocation" defaultValue={existing?.storageLocation ?? ''} required />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="minimumRetentionPeriod">Minimum Retention Period</Label>
          <Input id="minimumRetentionPeriod" name="minimumRetentionPeriod" defaultValue={existing?.minimumRetentionPeriod ?? ''} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="scheduledDestructionReviewDate">Scheduled Destruction / Review Date</Label>
          <Input
            id="scheduledDestructionReviewDate"
            name="scheduledDestructionReviewDate"
            type="date"
            defaultValue={
              existing?.scheduledDestructionReviewDate ? existing.scheduledDestructionReviewDate.toISOString().slice(0, 10) : ''
            }
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} defaultValue={existing?.notes ?? ''} />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </Card>
  )
}
