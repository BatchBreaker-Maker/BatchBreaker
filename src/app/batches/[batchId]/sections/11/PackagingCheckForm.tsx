'use client'

import { useActionState } from 'react'
import { addPackagingCheck } from '@/server/packaging/actions'
import type { FormActionState } from '@/server/batches/actions'
import { useDefaultDateTimeLocal } from '@/lib/dateInputDefaults'

export function PackagingCheckForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addPackagingCheck, undefined)
  const defaultTime = useDefaultDateTimeLocal()
  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'

  return (
    <form action={formAction} className="flex flex-col gap-3 w-full max-w-lg border border-zinc-200 rounded p-4 dark:border-zinc-800">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <h3 className="text-sm font-semibold">Add in-process packaging check</h3>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="time">Time</label>
        <input
          id="time"
          name="time"
          type="datetime-local"
          defaultValue={defaultTime}
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="componentCorrect" defaultChecked className="h-4 w-4" /> Component correct?
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="labelCorrect" defaultChecked className="h-4 w-4" /> Label correct?
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="appearanceOk" defaultChecked className="h-4 w-4" /> Appearance OK?
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="fillWeightOk" defaultChecked className="h-4 w-4" /> Fill/weight OK?
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={2} className={inputClass} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add check'}
      </button>
    </form>
  )
}
