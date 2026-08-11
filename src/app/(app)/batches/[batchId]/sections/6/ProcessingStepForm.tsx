'use client'

import { useActionState } from 'react'
import { saveProcessingSteps } from '@/server/inProcess/actions'
import type { FormActionState } from '@/server/batches/actions'
import { PROCESSING_STEP_LABELS, PROCESSING_STEP_ORDER } from '@/lib/workflow/inProcessLabels'
import type { ProcessingStepModel } from '@/generated/prisma/models'
import { Button, Input, TBody, TD, TH, THead, TR, Table } from '@/components/ui'

// Mirrors CureRecordForm's local toLocalInputValue — datetime-local inputs
// are typed/displayed in the browser's local time with no timezone info, so
// a stored UTC value must be shifted by the local offset before formatting,
// or resaving an untouched row (the whole table submits together) would
// reinterpret the displayed string as local time on the server and drift
// the stored value by the server/browser timezone gap on every save.
function toLocalInputValue(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function ProcessingStepForm({
  batchRecordId,
  existingByStep,
}: {
  batchRecordId: string
  existingByStep: Partial<Record<number, ProcessingStepModel>>
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveProcessingSteps, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <div className="w-full overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <TH>Step</TH>
              <TH>Time Performed</TH>
              <TH>Observations / Notes</TH>
            </TR>
          </THead>
          <TBody>
            {PROCESSING_STEP_ORDER.map((stepNumber) => {
              const existing = existingByStep[stepNumber]
              return (
                <TR key={stepNumber}>
                  <TD className="max-w-sm">
                    {stepNumber}. {PROCESSING_STEP_LABELS[stepNumber]}
                  </TD>
                  <TD>
                    <Input
                      name={`step${stepNumber}__timePerformed`}
                      type="datetime-local"
                      defaultValue={existing ? toLocalInputValue(existing.timePerformed) : ''}
                      className="min-w-48"
                    />
                  </TD>
                  <TD>
                    <Input
                      name={`step${stepNumber}__notes`}
                      defaultValue={existing?.observationsNotes ?? ''}
                      placeholder="Observations / notes"
                      className="min-w-56"
                    />
                  </TD>
                </TR>
              )
            })}
          </TBody>
        </Table>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Saving…' : 'Save processing steps'}
      </Button>
    </form>
  )
}
