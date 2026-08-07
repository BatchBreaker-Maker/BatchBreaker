'use client'

import { useActionState, useState } from 'react'
import { savePostProductionCloseout } from '@/server/closeout/actions'
import type { FormActionState } from '@/server/batches/actions'
import type { PostProductionCloseoutModel } from '@/generated/prisma/models'

export function PostProductionCloseoutForm({
  batchRecordId,
  existing,
}: {
  batchRecordId: string
  existing: PostProductionCloseoutModel | null
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(savePostProductionCloseout, undefined)
  const [subcontracted, setSubcontracted] = useState(existing?.stepsSubcontracted ?? false)
  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-lg">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="bulkStorageLocation">Bulk Storage Location</label>
        <input
          id="bulkStorageLocation"
          name="bulkStorageLocation"
          defaultValue={existing?.bulkStorageLocation ?? ''}
          className={inputClass}
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="enteredInStoreLog" defaultChecked={existing?.enteredInStoreLog ?? false} className="h-4 w-4" />
        Entered in Store Log
      </label>

      <fieldset className="flex flex-col gap-1">
        <legend className={labelClass}>Entered in ERP?</legend>
        <div className="flex gap-4">
          {(['YES', 'NO', 'NA'] as const).map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm">
              <input type="radio" name="enteredInErp" value={v} defaultChecked={existing?.enteredInErp === v} required />
              {v}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-1">
        <legend className={labelClass}>Unused Raw Material Returned?</legend>
        <div className="flex gap-4">
          {(['YES', 'NO', 'NA'] as const).map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm">
              <input type="radio" name="unusedRmReturned" value={v} defaultChecked={existing?.unusedRmReturned === v} required />
              {v}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="quantitiesRmReturned">Quantities RM Returned (describe)</label>
        <input
          id="quantitiesRmReturned"
          name="quantitiesRmReturned"
          defaultValue={existing?.quantitiesRmReturned ?? ''}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="stepsSubcontracted"
          checked={subcontracted}
          onChange={(e) => setSubcontracted(e.target.checked)}
          className="h-4 w-4"
        />
        Any steps subcontracted?
      </label>

      {subcontracted && (
        <div className="flex flex-col gap-3 rounded bg-zinc-50 p-3 dark:bg-zinc-900">
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="subcontractorNameStep">Subcontractor Name / Step</label>
            <input
              id="subcontractorNameStep"
              name="subcontractorNameStep"
              defaultValue={existing?.subcontractorNameStep ?? ''}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="subcontractorRecordAttached"
              defaultChecked={existing?.subcontractorRecordAttached ?? false}
              className="h-4 w-4"
            />
            Subcontractor record attached
          </label>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="batchCloseoutDate">Batch Closeout Date</label>
        <input
          id="batchCloseoutDate"
          name="batchCloseoutDate"
          type="date"
          defaultValue={existing?.batchCloseoutDate ? existing.batchCloseoutDate.toISOString().slice(0, 10) : ''}
          className={inputClass}
          required
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save closeout'}
      </button>
    </form>
  )
}
