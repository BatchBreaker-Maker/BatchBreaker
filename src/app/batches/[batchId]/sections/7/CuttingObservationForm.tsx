'use client'

import { useActionState } from 'react'
import { addCuttingObservation } from '@/server/cutting/actions'
import type { FormActionState } from '@/server/batches/actions'

export function CuttingObservationForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addCuttingObservation, undefined)
  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-3 w-full max-w-2xl border border-zinc-200 rounded p-4 dark:border-zinc-800">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <h3 className="text-sm font-semibold">Add pour observation</h3>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="pourNumber">Pour #</label>
        <input id="pourNumber" name="pourNumber" type="number" min="1" className={inputClass} required />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="tempTopF">Temp — Top (°F)</label>
          <input id="tempTopF" name="tempTopF" type="number" step="0.1" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="tempSideF">Temp — Side (°F)</label>
          <input id="tempSideF" name="tempSideF" type="number" step="0.1" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="tempMiddleF">Temp — Middle (°F)</label>
          <input id="tempMiddleF" name="tempMiddleF" type="number" step="0.1" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="colorUniformity">Color Uniformity</label>
        <input id="colorUniformity" name="colorUniformity" className={inputClass} />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="visibleSeparation" className="h-4 w-4" /> Visible separation?
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="foreignMatter" className="h-4 w-4" /> Foreign matter?
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="fragranceAdditionalComments">Fragrance / Additional Comments</label>
        <textarea id="fragranceAdditionalComments" name="fragranceAdditionalComments" rows={2} className={inputClass} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add observation'}
      </button>
    </form>
  )
}
