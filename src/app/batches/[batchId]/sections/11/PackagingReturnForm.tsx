'use client'

import { useActionState } from 'react'
import { savePackagingReturn } from '@/server/packaging/actions'
import type { FormActionState } from '@/server/batches/actions'
import type { PackagingReturnModel } from '@/generated/prisma/models'

export function PackagingReturnForm({ batchRecordId, existing }: { batchRecordId: string; existing: PackagingReturnModel | null }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(savePackagingReturn, undefined)
  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-lg">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">Unused packaging returned to store?</legend>
        {(['YES', 'NO', 'NA'] as const).map((v) => (
          <label key={v} className="flex items-center gap-2 text-sm">
            <input type="radio" name="returned" value={v} defaultChecked={existing?.returned === v} required />
            {v}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="quantitiesReturned">Quantities Returned (describe)</label>
        <input id="quantitiesReturned" name="quantitiesReturned" defaultValue={existing?.quantitiesReturned ?? ''} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="returnedDate">Returned Date</label>
        <input
          id="returnedDate"
          name="returnedDate"
          type="date"
          defaultValue={existing?.returnedDate ? existing.returnedDate.toISOString().slice(0, 10) : ''}
          className={inputClass}
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
