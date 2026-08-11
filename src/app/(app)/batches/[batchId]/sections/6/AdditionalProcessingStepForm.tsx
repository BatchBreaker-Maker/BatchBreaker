'use client'

import { useActionState } from 'react'
import { addAdditionalProcessingStep } from '@/server/inProcess/actions'
import type { FormActionState } from '@/server/batches/actions'
import { useDefaultDateTimeLocal } from '@/lib/dateInputDefaults'
import { Button, Card, Input, Label, Textarea } from '@/components/ui'

export function AdditionalProcessingStepForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    addAdditionalProcessingStep,
    undefined,
  )
  const defaultTimePerformed = useDefaultDateTimeLocal()

  return (
    <Card className="w-full max-w-lg">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />
        <h3 className="text-sm font-semibold text-text">Add additional step</h3>

        <div className="flex flex-col gap-1">
          <Label htmlFor="stepDescription">Step / Direction</Label>
          <Input id="stepDescription" name="stepDescription" required />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="additionalStepTimePerformed">Time Performed</Label>
          <Input
            id="additionalStepTimePerformed"
            name="timePerformed"
            type="datetime-local"
            defaultValue={defaultTimePerformed}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="additionalStepObservationsNotes">Observations / Notes</Label>
          <Textarea id="additionalStepObservationsNotes" name="observationsNotes" rows={2} />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Adding…' : 'Add step'}
        </Button>
      </form>
    </Card>
  )
}
