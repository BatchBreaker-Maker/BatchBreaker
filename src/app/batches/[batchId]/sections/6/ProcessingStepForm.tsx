'use client'

import { useActionState, useState } from 'react'
import { addProcessingStep } from '@/server/inProcess/actions'
import type { FormActionState } from '@/server/batches/actions'
import { PROCESSING_STEP_DEFAULTS } from '@/lib/workflow/inProcessLabels'

export function ProcessingStepForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addProcessingStep, undefined)
  const [stepNumber, setStepNumber] = useState('1')
  const [description, setDescription] = useState(PROCESSING_STEP_DEFAULTS[1])

  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="stepNumber">Step #</label>
          <select
            id="stepNumber"
            name="stepNumber"
            className={inputClass}
            value={stepNumber}
            onChange={(e) => {
              setStepNumber(e.target.value)
              setDescription(PROCESSING_STEP_DEFAULTS[Number(e.target.value)] ?? '')
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n === 8 ? '8 — Other' : n}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="timePerformed">Time Performed</label>
          <input id="timePerformed" name="timePerformed" type="datetime-local" className={inputClass} required />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="stepDescription">Description</label>
        <input
          id="stepDescription"
          name="stepDescription"
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="observationsNotes">Observations / Notes</label>
        <textarea id="observationsNotes" name="observationsNotes" rows={2} className={inputClass} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add step'}
      </button>
    </form>
  )
}
