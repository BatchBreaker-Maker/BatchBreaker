'use client'

import { useActionState, useMemo, useState } from 'react'
import { createBatchRecord, type FormActionState } from '@/server/batches/actions'

type Product = { id: string; productName: string; productCodeSku: string }
type Formula = { id: string; productId: string; formulaNumber: string; version: string }

export function NewBatchForm({ products, formulas }: { products: Product[]; formulas: Formula[] }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(createBatchRecord, undefined)
  const [productId, setProductId] = useState(products[0]?.id ?? '')

  const formulasForProduct = useMemo(
    () => formulas.filter((f) => f.productId === productId),
    [formulas, productId],
  )

  const inputClass = 'rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-4 w-full max-w-lg">
      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="productId">Product</label>
        <select
          id="productId"
          name="productId"
          className={inputClass}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.productName} ({p.productCodeSku})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="formulaId">Formula / Master Formula Record #</label>
        <select id="formulaId" name="formulaId" className={inputClass} required>
          {formulasForProduct.map((f) => (
            <option key={f.id} value={f.id}>
              {f.formulaNumber} v{f.version}
            </option>
          ))}
        </select>
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
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Creating…' : 'Create batch record'}
      </button>
    </form>
  )
}
