'use client'

import { useActionState } from 'react'
import { addPressRun } from '@/server/stamping/actions'
import type { FormActionState } from '@/server/batches/actions'
import { useDefaultDateTimeLocal } from '@/lib/dateInputDefaults'

export function PressRunForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addPressRun, undefined)
  const defaultDateTime = useDefaultDateTimeLocal()
  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-3 w-full max-w-2xl border border-zinc-200 rounded p-4 dark:border-zinc-800">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <h3 className="text-sm font-semibold">Add press log entry</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="dateTime">Date/Time</label>
          <input
            id="dateTime"
            name="dateTime"
            type="datetime-local"
            defaultValue={defaultDateTime}
            className={inputClass}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="pressRunDieStampId">Die / Stamp ID</label>
          <input id="pressRunDieStampId" name="dieStampId" className={inputClass} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="impressionQuality">Impression Quality</label>
          <input id="impressionQuality" name="impressionQuality" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="barSurfaceCondition">Bar Surface Condition</label>
          <input id="barSurfaceCondition" name="barSurfaceCondition" className={inputClass} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="appearanceOk" defaultChecked className="h-4 w-4" />
        Appearance OK
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add run'}
      </button>
    </form>
  )
}
