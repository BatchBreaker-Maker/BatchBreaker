'use client'

import { useActionState, useState } from 'react'
import { addSamplingEntry } from '@/server/sampling/actions'
import type { FormActionState } from '@/server/batches/actions'

export function SamplingEntryForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addSamplingEntry, undefined)
  const [disposition, setDisposition] = useState('TESTED_RELEASED')
  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-3 w-full max-w-2xl border border-zinc-200 rounded p-4 dark:border-zinc-800">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <h3 className="text-sm font-semibold">Add sampling entry</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="dateTime">Date/Time</label>
          <input id="dateTime" name="dateTime" type="datetime-local" className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="samplingStage">Sampling Stage</label>
          <input id="samplingStage" name="samplingStage" className={inputClass} required />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="testType">Test Type</label>
        <input id="testType" name="testType" placeholder="visual, odor, etc." className={inputClass} required />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="resultObservation">Result / Observation</label>
        <textarea id="resultObservation" name="resultObservation" rows={2} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="actionTaken">Action Taken</label>
        <textarea id="actionTaken" name="actionTaken" rows={2} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="disposition">Disposition</label>
        <select
          id="disposition"
          name="disposition"
          className={inputClass}
          value={disposition}
          onChange={(e) => setDisposition(e.target.value)}
        >
          <option value="TESTED_RELEASED">Tested &amp; Released</option>
          <option value="RETAINED">Retained</option>
          <option value="DISCARDED">Discarded</option>
        </select>
      </div>

      {disposition === 'DISCARDED' && (
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="dispositionReason">Reason for Discarding</label>
          <input id="dispositionReason" name="dispositionReason" className={inputClass} required />
        </div>
      )}

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
