'use client'

import { useActionState, useState } from 'react'
import { addRawMaterialEntry } from '@/server/rawMaterials/actions'
import type { FormActionState } from '@/server/batches/actions'
import { Button, Card, Input, Label, Select, Textarea } from '@/components/ui'

export function RawMaterialForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addRawMaterialEntry, undefined)
  const [qualStatus, setQualStatus] = useState('APPROVED')

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />
        <h3 className="text-sm font-semibold text-text">Add raw material entry</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="tradeNameDescription">Trade Name / Description</Label>
            <Input id="tradeNameDescription" name="tradeNameDescription" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="internalPartCode">Internal Part Code</Label>
            <Input id="internalPartCode" name="internalPartCode" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="supplierName">Supplier Name</Label>
            <Input id="supplierName" name="supplierName" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="supplierLotBatchNumber">Supplier Lot / Batch #</Label>
            <Input id="supplierLotBatchNumber" name="supplierLotBatchNumber" required />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="qtyDispensed">Qty Dispensed</Label>
            <Input id="qtyDispensed" name="qtyDispensed" type="number" step="0.001" min="0" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" name="unit" required />
          </div>
        </div>

        <label className="flex min-h-11 items-center gap-2 text-sm text-text">
          <input type="checkbox" name="coaReceived" className="h-4 w-4 shrink-0" />
          COA Received
        </label>

        <div className="flex flex-col gap-1">
          <Label htmlFor="supplierQualStatus">Supplier Qualification Status</Label>
          <Select
            id="supplierQualStatus"
            name="supplierQualStatus"
            value={qualStatus}
            onChange={(e) => setQualStatus(e.target.value)}
          >
            <option value="APPROVED">Approved</option>
            <option value="CONDITIONAL">Conditional</option>
            <option value="BLOCKED">Blocked</option>
          </Select>
        </div>

        {qualStatus === 'CONDITIONAL' && (
          <label className="flex items-start gap-2 rounded-md bg-warning/15 p-2 text-sm text-text">
            <input type="checkbox" name="conditionalAcknowledged" className="mt-0.5 h-4 w-4 shrink-0" required />
            I acknowledge this supplier is only Conditionally qualified and choose to proceed.
          </label>
        )}
        {qualStatus === 'BLOCKED' && (
          <p className="text-sm text-danger">
            This supplier is Blocked — this entry cannot be saved. Contact HoP/QC before dispensing this material.
          </p>
        )}

        <div className="flex flex-col gap-1">
          <Label htmlFor="notes">Notes / Observations</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending || qualStatus === 'BLOCKED'} className="self-start">
          {pending ? 'Adding…' : 'Add entry'}
        </Button>
      </form>
    </Card>
  )
}
