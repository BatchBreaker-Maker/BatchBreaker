'use client'

import { useActionState, useState, useTransition } from 'react'
import {
  addAdditionalProcessingStep,
  correctAdditionalProcessingStep,
  deleteAdditionalProcessingStep,
  saveProcessingSteps,
} from '@/server/inProcess/actions'
import type { FormActionState } from '@/server/batches/actions'
import { PROCESSING_STEP_LABELS, PROCESSING_STEP_ORDER } from '@/lib/workflow/inProcessLabels'
import { useDefaultDateTimeLocal } from '@/lib/dateInputDefaults'
import type { ProcessingStepModel } from '@/generated/prisma/models'
import type { AdditionalProcessingStep } from '@/generated/prisma/client'
import { CorrectionModal } from '@/components/workflow/CorrectionModal'
import { Badge, Button, Input, Label, TBody, TD, TH, THead, TR, Table, Textarea } from '@/components/ui'

// Mirrors CureRecordForm's local toLocalInputValue — datetime-local inputs
// are typed/displayed in the browser's local time with no timezone info, so
// a stored UTC value must be shifted by the local offset before formatting,
// or resaving an untouched row (the whole table submits together) would
// reinterpret the displayed string as local time on the server and drift
// the stored value by the server/browser timezone gap on every save.
function toLocalInputValue(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

type AdditionalStepWithCorrections = AdditionalProcessingStep & { correctedByEntries: { id: string }[] }

export function ProcessingStepForm({
  batchRecordId,
  existingByStep,
  additionalSteps,
  canEdit,
  canDelete,
}: {
  batchRecordId: string
  existingByStep: Partial<Record<number, ProcessingStepModel>>
  additionalSteps: AdditionalStepWithCorrections[]
  canEdit: boolean
  canDelete: boolean
}) {
  const [saveState, saveFormAction, savePending] = useActionState<FormActionState, FormData>(
    saveProcessingSteps,
    undefined,
  )
  const [addState, addFormAction, addPending] = useActionState<FormActionState, FormData>(
    addAdditionalProcessingStep,
    undefined,
  )
  const [correcting, setCorrecting] = useState<AdditionalStepWithCorrections | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()
  const defaultTimePerformed = useDefaultDateTimeLocal()

  function handleDelete(entry: AdditionalStepWithCorrections) {
    if (!window.confirm('Delete this additional step entry? This cannot be undone.')) return
    const formData = new FormData()
    formData.set('id', entry.id)
    formData.set('batchRecordId', batchRecordId)
    startDeleteTransition(() => {
      deleteAdditionalProcessingStep(formData)
    })
  }

  const showActionsColumn = canDelete && additionalSteps.length > 0

  return (
    <>
      <form action={saveFormAction} className="flex flex-col gap-4">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />

        <div className="w-full overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Step</TH>
                <TH>Time Performed</TH>
                <TH>Observations / Notes</TH>
                {showActionsColumn && <TH>&nbsp;</TH>}
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
                      {canEdit ? (
                        <Input
                          name={`step${stepNumber}__timePerformed`}
                          type="datetime-local"
                          defaultValue={existing ? toLocalInputValue(existing.timePerformed) : ''}
                          className="min-w-48"
                        />
                      ) : (
                        (existing && toLocalInputValue(existing.timePerformed).replace('T', ' ')) || '—'
                      )}
                    </TD>
                    <TD>
                      {canEdit ? (
                        <Input
                          name={`step${stepNumber}__notes`}
                          defaultValue={existing?.observationsNotes ?? ''}
                          placeholder="Observations / notes"
                          className="min-w-56"
                        />
                      ) : (
                        existing?.observationsNotes || '—'
                      )}
                    </TD>
                    {showActionsColumn && <TD />}
                  </TR>
                )
              })}

              {canEdit && (
                <TR>
                  <TD className="max-w-sm">
                    <div className="flex items-center gap-2">
                      <Input name="stepDescription" placeholder="Step / direction" className="min-w-40" />
                      <Button type="submit" formAction={addFormAction} variant="secondary" disabled={addPending}>
                        {addPending ? 'Adding…' : 'Add Additional Step'}
                      </Button>
                    </div>
                  </TD>
                  <TD>
                    <Input
                      name="timePerformed"
                      type="datetime-local"
                      defaultValue={defaultTimePerformed}
                      className="min-w-48"
                    />
                  </TD>
                  <TD>
                    <Input name="observationsNotes" placeholder="Observations / notes" className="min-w-56" />
                  </TD>
                  {showActionsColumn && <TD />}
                </TR>
              )}
              {canEdit && addState?.error && (
                <TR>
                  <TD colSpan={showActionsColumn ? 4 : 3} className="text-sm text-danger">
                    {addState.error}
                  </TD>
                </TR>
              )}

              {additionalSteps.map((s) => {
                const superseded = s.correctedByEntries.length > 0
                const clickable = canEdit && !superseded
                return (
                  <TR
                    key={s.id}
                    onClick={clickable ? () => setCorrecting(s) : undefined}
                    title={clickable ? 'Click to correct this entry' : undefined}
                    className={clickable ? 'cursor-pointer hover:bg-surface-hover' : ''}
                  >
                    <TD className={`max-w-sm ${superseded ? 'text-text-muted line-through' : ''}`}>
                      {s.stepDescription}
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
                    <TD className={superseded ? 'text-text-muted line-through' : ''}>
                      {toLocalInputValue(s.timePerformed).replace('T', ' ')}
                    </TD>
                    <TD className={superseded ? 'text-text-muted line-through' : ''}>{s.observationsNotes || '—'}</TD>
                    {showActionsColumn && (
                      <TD>
                        {canDelete && (
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(s)
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </TD>
                    )}
                  </TR>
                )
              })}
            </TBody>
          </Table>
        </div>

        {saveState?.error && <p className="text-sm text-danger">{saveState.error}</p>}

        {canEdit && (
          <Button type="submit" disabled={savePending} className="self-start">
            {savePending ? 'Saving…' : 'Save processing steps'}
          </Button>
        )}
      </form>

      {correcting && (
        <CorrectionModal
          open={!!correcting}
          onClose={() => setCorrecting(null)}
          title="Correct additional step"
          action={correctAdditionalProcessingStep}
          hiddenFields={{ batchRecordId, correctsEntryId: correcting.id }}
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="correctStepDescription">Step / Direction</Label>
            <Input
              id="correctStepDescription"
              name="stepDescription"
              defaultValue={correcting.stepDescription}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="correctTimePerformed">Time Performed</Label>
            <Input
              id="correctTimePerformed"
              name="timePerformed"
              type="datetime-local"
              defaultValue={toLocalInputValue(correcting.timePerformed)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="correctObservationsNotes">Observations / Notes</Label>
            <Textarea
              id="correctObservationsNotes"
              name="observationsNotes"
              rows={2}
              defaultValue={correcting.observationsNotes ?? ''}
            />
          </div>
        </CorrectionModal>
      )}
    </>
  )
}
