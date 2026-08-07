'use client'

import { useActionState, useState } from 'react'
import { addRawMaterialEntry } from '@/server/rawMaterials/actions'
import type { FormActionState } from '@/server/batches/actions'

export function RawMaterialForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addRawMaterialEntry, undefined)
  const [qualStatus, setQualStatus] = useState('APPROVED')

  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-3 w-full max-w-2xl border border-zinc-200 rounded p-4 dark:border-zinc-800">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <h3 className="text-sm font-semibold">Add raw material entry</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="tradeNameDescription">Trade Name / Description</label>
          <input id="tradeNameDescription" name="tradeNameDescription" className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="internalPartCode">Internal Part Code</label>
          <input id="internalPartCode" name="internalPartCode" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="supplierName">Supplier Name</label>
          <input id="supplierName" name="supplierName" className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="supplierLotBatchNumber">Supplier Lot / Batch #</label>
          <input id="supplierLotBatchNumber" name="supplierLotBatchNumber" className={inputClass} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="qtyDispensed">Qty Dispensed</label>
          <input id="qtyDispensed" name="qtyDispensed" type="number" step="0.001" min="0" className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="unit">Unit</label>
          <input id="unit" name="unit" className={inputClass} required />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="coaReceived" className="h-4 w-4" />
        COA Received
      </label>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="supplierQualStatus">Supplier Qualification Status</label>
        <select
          id="supplierQualStatus"
          name="supplierQualStatus"
          className={inputClass}
          value={qualStatus}
          onChange={(e) => setQualStatus(e.target.value)}
        >
          <option value="APPROVED">Approved</option>
          <option value="CONDITIONAL">Conditional</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      {qualStatus === 'CONDITIONAL' && (
        <label className="flex items-start gap-2 text-sm rounded bg-amber-50 p-2 dark:bg-amber-950">
          <input type="checkbox" name="conditionalAcknowledged" className="mt-0.5 h-4 w-4" required />
          I acknowledge this supplier is only Conditionally qualified and choose to proceed.
        </label>
      )}
      {qualStatus === 'BLOCKED' && (
        <p className="text-sm text-red-600">
          This supplier is Blocked — this entry cannot be saved. Contact HoP/QC before dispensing this material.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="notes">Notes / Observations</label>
        <textarea id="notes" name="notes" rows={2} className={inputClass} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || qualStatus === 'BLOCKED'}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add entry'}
      </button>
    </form>
  )
}
