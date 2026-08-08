'use client'

import { useState } from 'react'
import { Badge, Input, Label, TBody, TD, TH, THead, TR, Table, Textarea } from '@/components/ui'
import { correctProcessingStep } from '@/server/inProcess/actions'
import { CorrectionModal } from '@/components/workflow/CorrectionModal'
import type { ProcessingStep } from '@/generated/prisma/client'

type StepWithCorrections = ProcessingStep & { correctedByEntries: { id: string }[] }

export function ProcessingStepLogTable({
  steps,
  batchRecordId,
  canCorrect,
}: {
  steps: StepWithCorrections[]
  batchRecordId: string
  canCorrect: boolean
}) {
  const [correcting, setCorrecting] = useState<StepWithCorrections | null>(null)

  return (
    <div className="max-w-3xl">
      <Table>
        <THead>
          <TR>
            <TH>Step #</TH>
            <TH>Description</TH>
            <TH>Time Performed</TH>
            <TH>Observations</TH>
          </TR>
        </THead>
        <TBody>
          {steps.map((s) => {
            const superseded = s.correctedByEntries.length > 0
            const clickable = canCorrect && !superseded
            return (
              <TR
                key={s.id}
                onClick={clickable ? () => setCorrecting(s) : undefined}
                title={clickable ? 'Click to correct this entry' : undefined}
                className={clickable ? 'cursor-pointer hover:bg-surface-hover' : ''}
              >
                <TD className={superseded ? 'text-text-muted line-through' : ''}>
                  {s.stepNumber}
                  {s.correctsEntryId && (
                    <Badge status="accent" className="ml-2">
                      Correction
                    </Badge>
                  )}
                  {superseded && (
                    <Badge status="neutral" className="ml-2">
                      Corrected
                    </Badge>
                  )}
                </TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{s.stepDescription}</TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>
                  {s.timePerformed.toISOString().slice(0, 16).replace('T', ' ')}
                </TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{s.observationsNotes || '—'}</TD>
              </TR>
            )
          })}
        </TBody>
      </Table>
      {steps.length === 0 && <p className="mt-2 text-sm text-text-muted">No processing steps logged yet.</p>}

      {correcting && (
        <CorrectionModal
          open={!!correcting}
          onClose={() => setCorrecting(null)}
          title={`Correct step #${correcting.stepNumber}`}
          action={correctProcessingStep}
          hiddenFields={{
            batchRecordId,
            correctsEntryId: correcting.id,
            // stepNumber is required by the correction schema even though
            // the server keeps original.stepNumber authoritative — a
            // correction can't change which step it's for.
            stepNumber: String(correcting.stepNumber),
          }}
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="stepDescription">Description</Label>
            <Input id="stepDescription" name="stepDescription" defaultValue={correcting.stepDescription} required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="timePerformed">Time Performed</Label>
            <Input
              id="timePerformed"
              name="timePerformed"
              type="datetime-local"
              defaultValue={correcting.timePerformed.toISOString().slice(0, 16)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="observationsNotes">Observations / Notes</Label>
            <Textarea
              id="observationsNotes"
              name="observationsNotes"
              rows={2}
              defaultValue={correcting.observationsNotes ?? ''}
            />
          </div>
        </CorrectionModal>
      )}
    </div>
  )
}
