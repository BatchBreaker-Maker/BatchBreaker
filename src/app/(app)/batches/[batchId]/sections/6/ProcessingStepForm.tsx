'use client'

import { useActionState, useState } from 'react'
import { addProcessingStep } from '@/server/inProcess/actions'
import type { FormActionState } from '@/server/batches/actions'
import { PROCESSING_STEP_DEFAULTS } from '@/lib/workflow/inProcessLabels'
import { useDefaultDateTimeLocal } from '@/lib/dateInputDefaults'
import { Button, Card, Input, Label, Select, Textarea } from '@/components/ui'

export function ProcessingStepForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addProcessingStep, undefined)
  const [stepNumber, setStepNumber] = useState('1')
  const [description, setDescription] = useState(PROCESSING_STEP_DEFAULTS[1])
  const defaultTimePerformed = useDefaultDateTimeLocal()

  return (
    <Card className="w-full max-w-lg">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />
        <h3 className="text-sm font-semibold text-text">Add processing step</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="stepNumber">Step #</Label>
            <Select
              id="stepNumber"
              name="stepNumber"
              value={stepNumber}
              onChange={(e) => {
                setStepNumber(e.target.value)
                setDescription(PROCESSING_STEP_DEFAULTS[Number(e.target.value)] ?? '')
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n === 8 ? '8 — Other' : n}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="timePerformed">Time Performed</Label>
            <Input
              id="timePerformed"
              name="timePerformed"
              type="datetime-local"
              defaultValue={defaultTimePerformed}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="stepDescription">Description</Label>
          <Input
            id="stepDescription"
            name="stepDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="observationsNotes">Observations / Notes</Label>
          <Textarea id="observationsNotes" name="observationsNotes" rows={2} />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Adding…' : 'Add step'}
        </Button>
      </form>
    </Card>
  )
}
