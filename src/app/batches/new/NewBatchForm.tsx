'use client'

import { useActionState, useState } from 'react'
import { createBatchRecord, type FormActionState } from '@/server/batches/actions'

export function NewBatchForm() {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(createBatchRecord, undefined)
  const [batchNumber, setBatchNumber] = useState('')
  const [confirmBatchNumber, setConfirmBatchNumber] = useState('')
  const confirmTouched = confirmBatchNumber.length > 0
  const batchNumbersMatch = batchNumber === confirmBatchNumber

  const inputClass = 'rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-4 w-full max-w-lg">
      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="batchNumber">Batch Number</label>
        <input
          id="batchNumber"
          name="batchNumber"
          className={inputClass}
          value={batchNumber}
          onChange={(e) => setBatchNumber(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="confirmBatchNumber">Confirm Batch Number</label>
        <input
          id="confirmBatchNumber"
          name="confirmBatchNumber"
          className={inputClass}
          value={confirmBatchNumber}
          onChange={(e) => setConfirmBatchNumber(e.target.value)}
          required
        />
        {confirmTouched && !batchNumbersMatch && (
          <p className="text-sm text-red-600">Batch numbers do not match.</p>
        )}
        <p className="text-xs text-zinc-500">
          Enter the batch number twice to confirm it&apos;s correct. It cannot be changed after the batch is created.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="productName">Product Name</label>
        <input id="productName" name="productName" className={inputClass} required />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="productCodeSku">Product Code / SKU</label>
        <input id="productCodeSku" name="productCodeSku" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="productType">Product Type</label>
        <select id="productType" name="productType" className={inputClass} defaultValue="BAR_SOAP" required>
          <option value="BAR_SOAP">Bar Soap</option>
          <option value="LIQUID_HAND_SOAP">Liquid Hand Soap</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="finishedProductSpecRef">Finished Product Specification Reference</label>
        <input id="finishedProductSpecRef" name="finishedProductSpecRef" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="formulaNumber">Formula / Master Formula Record #</label>
          <input id="formulaNumber" name="formulaNumber" className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="formulaVersion">Formula Version / Revision</label>
          <input id="formulaVersion" name="formulaVersion" className={inputClass} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="batchSizeTarget">Batch Size (target)</label>
          <input id="batchSizeTarget" name="batchSizeTarget" type="number" step="0.001" min="0" className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="batchSizeUnit">Unit</label>
          <input id="batchSizeUnit" name="batchSizeUnit" placeholder="lb" className={inputClass} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="productionDate">Production Date</label>
          <input id="productionDate" name="productionDate" type="date" className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="plannedCompletionDate">Planned Completion Date</label>
          <input id="plannedCompletionDate" name="plannedCompletionDate" type="date" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="manufacturingSiteRoom">Manufacturing Site / Room</label>
        <input id="manufacturingSiteRoom" name="manufacturingSiteRoom" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="complaintRecallRef">Complaint / Recall Cross-Reference # (if applicable)</label>
        <input id="complaintRecallRef" name="complaintRecallRef" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="adverseEventRef">Adverse Event (SAE) Cross-Reference # (if applicable)</label>
        <input id="adverseEventRef" name="adverseEventRef" className={inputClass} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || (confirmTouched && !batchNumbersMatch)}
        className="self-start rounded bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Creating…' : 'Create batch record'}
      </button>
    </form>
  )
}
