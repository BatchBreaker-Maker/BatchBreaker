'use client'

import { useActionState } from 'react'
import { addTemperatureEntry } from '@/server/temperatures/actions'
import type { FormActionState } from '@/server/batches/actions'
import { useDefaultDateTimeLocal } from '@/lib/dateInputDefaults'

export function TemperatureForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addTemperatureEntry, undefined)
  const defaultTimeOfAddition = useDefaultDateTimeLocal()
  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-3 w-full max-w-lg border border-zinc-200 rounded p-4 dark:border-zinc-800">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <h3 className="text-sm font-semibold">Add temperature entry</h3>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="materialIngredient">Material / Ingredient</label>
        <input id="materialIngredient" name="materialIngredient" className={inputClass} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="acceptableTempMinF">Acceptable Min (°F)</label>
          <input id="acceptableTempMinF" name="acceptableTempMinF" type="number" step="0.1" className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="acceptableTempMaxF">Acceptable Max (°F)</label>
          <input id="acceptableTempMaxF" name="acceptableTempMaxF" type="number" step="0.1" className={inputClass} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="actualTempF">Actual Temp at Addition (°F)</label>
          <input id="actualTempF" name="actualTempF" type="number" step="0.1" className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="timeOfAddition">Time of Addition</label>
          <input
            id="timeOfAddition"
            name="timeOfAddition"
            type="datetime-local"
            defaultValue={defaultTimeOfAddition}
            className={inputClass}
            required
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add entry'}
      </button>
    </form>
  )
}
