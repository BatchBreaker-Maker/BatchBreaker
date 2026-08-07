'use client'

import { useActionState } from 'react'
import { addDeviationEntry } from '@/server/deviations/actions'
import type { FormActionState } from '@/server/batches/actions'
import { useDefaultDateTimeLocal } from '@/lib/dateInputDefaults'

type UserOption = { id: string; fullName: string }

export function DeviationEntryForm({ batchRecordId, users }: { batchRecordId: string; users: UserOption[] }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addDeviationEntry, undefined)
  const defaultDateTime = useDefaultDateTimeLocal()
  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'

  return (
    <form action={formAction} className="flex flex-col gap-3 w-full max-w-lg border border-zinc-200 rounded p-4 dark:border-zinc-800">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <h3 className="text-sm font-semibold">Log a deviation / incident</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="dateTime">Date/Time</label>
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
          <label className="text-sm font-medium" htmlFor="type">Type</label>
          <select id="type" name="type" className={inputClass} required defaultValue="">
            <option value="" disabled>Select…</option>
            <option value="INCIDENT">Incident</option>
            <option value="DEVIATION">Deviation</option>
            <option value="CRITICAL_DEVIATION">Critical Deviation</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} className={inputClass} required />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="correctiveActionTaken">Corrective Action Taken</label>
        <textarea id="correctiveActionTaken" name="correctiveActionTaken" rows={2} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="reportedToUserId">Reported To</label>
        <select id="reportedToUserId" name="reportedToUserId" className={inputClass} defaultValue="">
          <option value="">(none)</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Logging…' : 'Log deviation'}
      </button>
    </form>
  )
}
