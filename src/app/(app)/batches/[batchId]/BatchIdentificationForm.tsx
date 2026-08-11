'use client'

import { useActionState } from 'react'
import { updateBatchIdentification, type FormActionState } from '@/server/batches/actions'
import { Button, Input, Label } from '@/components/ui'

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-text">{value}</dd>
    </>
  )
}

export function BatchIdentificationForm({
  batchRecordId,
  productName,
  productCodeSku,
  productType,
  formulaNumber,
  formulaVersion,
  batchSizeTarget,
  batchSizeUnit,
  productionDate,
  plannedCompletionDate,
  retentionDeadline,
  finishedProductSpecRef,
  manufacturingSiteRoom,
  complaintRecallRef,
  adverseEventRef,
  canEdit,
}: {
  batchRecordId: string
  productName: string
  productCodeSku: string | null
  productType: string
  formulaNumber: string
  formulaVersion: string
  batchSizeTarget: string
  batchSizeUnit: string
  productionDate: string
  plannedCompletionDate: string | null
  retentionDeadline: string
  finishedProductSpecRef: string | null
  manufacturingSiteRoom: string | null
  complaintRecallRef: string | null
  adverseEventRef: string | null
  canEdit: boolean
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    updateBatchIdentification,
    undefined,
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <LockedField label="Product Name" value={productName} />
        <LockedField label="Product Code / SKU" value={productCodeSku || '—'} />
        <LockedField label="Product Type" value={productType.replaceAll('_', ' ')} />
        <LockedField label="Formula" value={`${formulaNumber} v${formulaVersion}`} />
        <LockedField label="Batch size" value={`${batchSizeTarget} ${batchSizeUnit}`} />
        <LockedField label="Production date" value={productionDate} />
        <LockedField label="Planned completion date" value={plannedCompletionDate || '—'} />
        <LockedField label="Record retention deadline" value={retentionDeadline} />
      </dl>

      <div className="flex max-w-2xl flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="finishedProductSpecRef">Finished Product Specification Reference</Label>
          {canEdit ? (
            <Input
              id="finishedProductSpecRef"
              name="finishedProductSpecRef"
              defaultValue={finishedProductSpecRef ?? ''}
            />
          ) : (
            <p className="text-sm text-text">{finishedProductSpecRef || '—'}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="manufacturingSiteRoom">Manufacturing Site / Room</Label>
          {canEdit ? (
            <Input id="manufacturingSiteRoom" name="manufacturingSiteRoom" defaultValue={manufacturingSiteRoom ?? ''} />
          ) : (
            <p className="text-sm text-text">{manufacturingSiteRoom || '—'}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="complaintRecallRef">Complaint / Recall Cross-Reference # (if applicable)</Label>
          {canEdit ? (
            <Input id="complaintRecallRef" name="complaintRecallRef" defaultValue={complaintRecallRef ?? ''} />
          ) : (
            <p className="text-sm text-text">{complaintRecallRef || 'N/A'}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="adverseEventRef">Adverse Event (SAE) Cross-Reference # (if applicable)</Label>
          {canEdit ? (
            <Input id="adverseEventRef" name="adverseEventRef" defaultValue={adverseEventRef ?? ''} />
          ) : (
            <p className="text-sm text-text">{adverseEventRef || 'N/A'}</p>
          )}
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      {canEdit && (
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      )}
    </form>
  )
}
