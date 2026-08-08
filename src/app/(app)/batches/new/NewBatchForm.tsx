'use client'

import { useActionState, useState } from 'react'
import { createBatchRecord, type FormActionState } from '@/server/batches/actions'
import { useDefaultDateInput } from '@/lib/dateInputDefaults'
import { Button, Input, Label, Select } from '@/components/ui'

export function NewBatchForm() {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(createBatchRecord, undefined)
  const [batchNumber, setBatchNumber] = useState('')
  const [confirmBatchNumber, setConfirmBatchNumber] = useState('')
  const defaultProductionDate = useDefaultDateInput()
  const confirmTouched = confirmBatchNumber.length > 0
  const batchNumbersMatch = batchNumber === confirmBatchNumber

  return (
    <form action={formAction} className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="batchNumber">Batch Number</Label>
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
        <Label htmlFor="productName">Product Name</Label>
        <Input id="productName" name="productName" required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="productCodeSku">Product Code / SKU</Label>
        <Input id="productCodeSku" name="productCodeSku" />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="productType">Product Type</Label>
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
          <Label htmlFor="formulaNumber">Formula / Master Formula Record #</Label>
          <Input id="formulaNumber" name="formulaNumber" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="formulaVersion">Formula Version / Revision</Label>
          <Input id="formulaVersion" name="formulaVersion" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="batchSizeTarget">Batch Size (target)</Label>
          <Input id="batchSizeTarget" name="batchSizeTarget" type="number" step="0.001" min="0" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="batchSizeUnit">Unit</Label>
          <Input id="batchSizeUnit" name="batchSizeUnit" placeholder="lb" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="productionDate">Production Date</Label>
          <Input
            id="productionDate"
            name="productionDate"
            type="date"
            defaultValue={defaultProductionDate}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="plannedCompletionDate">Planned Completion Date</Label>
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
