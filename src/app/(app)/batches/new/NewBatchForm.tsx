'use client'

import { useActionState, useState, type ReactNode } from 'react'
import { createBatchRecord, type FormActionState } from '@/server/batches/actions'
import { useDefaultDateInput } from '@/lib/dateInputDefaults'
import { Button, Input, Label, LockedFieldFlag, Select } from '@/components/ui'

// Wraps Label with the locked-field warning icon — used for every Section 1
// field except the four (finished product spec ref, manufacturing site/room,
// complaint/recall ref, adverse event ref) that stay editable after the
// batch record is created. This is the only place that warning belongs: the
// batch overview page shows these fields read-only after creation anyway, so
// repeating the warning there would be redundant (2026-08-11 user direction).
function LockedLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <Label htmlFor={htmlFor}>{children}</Label>
      <LockedFieldFlag />
    </div>
  )
}

export function NewBatchForm() {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(createBatchRecord, undefined)
  const [batchNumber, setBatchNumber] = useState('')
  const [confirmBatchNumber, setConfirmBatchNumber] = useState('')
  const defaultProductionDate = useDefaultDateInput()
  const confirmTouched = confirmBatchNumber.length > 0
  const batchNumbersMatch = batchNumber === confirmBatchNumber

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <LockedLabel htmlFor="batchNumber">Batch Number</LockedLabel>
        <Input
          id="batchNumber"
          name="batchNumber"
          value={batchNumber}
          onChange={(e) => setBatchNumber(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="confirmBatchNumber">Confirm Batch Number</Label>
        <Input
          id="confirmBatchNumber"
          name="confirmBatchNumber"
          value={confirmBatchNumber}
          onChange={(e) => setConfirmBatchNumber(e.target.value)}
          required
        />
        {confirmTouched && !batchNumbersMatch && (
          <p className="text-sm text-danger">Batch numbers do not match.</p>
        )}
        <p className="text-xs text-text-muted">
          Enter the batch number twice to confirm it&apos;s correct. It cannot be changed after the batch is created.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <LockedLabel htmlFor="productName">Product Name</LockedLabel>
        <Input id="productName" name="productName" required />
      </div>

      <div className="flex flex-col gap-1">
        <LockedLabel htmlFor="productCodeSku">Product Code / SKU</LockedLabel>
        <Input id="productCodeSku" name="productCodeSku" />
      </div>

      <div className="flex flex-col gap-1">
        <LockedLabel htmlFor="productType">Product Type</LockedLabel>
        <Select id="productType" name="productType" defaultValue="BAR_SOAP" required>
          <option value="BAR_SOAP">Bar Soap</option>
          <option value="LIQUID_HAND_SOAP">Liquid Hand Soap</option>
          <option value="OTHER">Other</option>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="finishedProductSpecRef">Finished Product Specification Reference</Label>
        <Input id="finishedProductSpecRef" name="finishedProductSpecRef" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <LockedLabel htmlFor="formulaNumber">Formula / Master Formula Record #</LockedLabel>
          <Input id="formulaNumber" name="formulaNumber" required />
        </div>
        <div className="flex flex-col gap-1">
          <LockedLabel htmlFor="formulaVersion">Formula Version / Revision</LockedLabel>
          <Input id="formulaVersion" name="formulaVersion" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <LockedLabel htmlFor="batchSizeTarget">Batch Size (target)</LockedLabel>
          <Input id="batchSizeTarget" name="batchSizeTarget" type="number" step="0.001" min="0" required />
        </div>
        <div className="flex flex-col gap-1">
          <LockedLabel htmlFor="batchSizeUnit">Unit</LockedLabel>
          <Input id="batchSizeUnit" name="batchSizeUnit" placeholder="lb" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <LockedLabel htmlFor="productionDate">Production Date</LockedLabel>
          <Input
            id="productionDate"
            name="productionDate"
            type="date"
            defaultValue={defaultProductionDate}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <LockedLabel htmlFor="plannedCompletionDate">Planned Completion Date</LockedLabel>
          <Input id="plannedCompletionDate" name="plannedCompletionDate" type="date" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="manufacturingSiteRoom">Manufacturing Site / Room</Label>
        <Input id="manufacturingSiteRoom" name="manufacturingSiteRoom" />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="complaintRecallRef">Complaint / Recall Cross-Reference # (if applicable)</Label>
        <Input id="complaintRecallRef" name="complaintRecallRef" />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="adverseEventRef">Adverse Event (SAE) Cross-Reference # (if applicable)</Label>
        <Input id="adverseEventRef" name="adverseEventRef" />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending || (confirmTouched && !batchNumbersMatch)} className="self-start">
        {pending ? 'Creating…' : 'Create batch record'}
      </Button>
    </form>
  )
}
