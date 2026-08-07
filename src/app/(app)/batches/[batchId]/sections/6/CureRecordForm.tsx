'use client'

import { useActionState } from 'react'
import { saveCureRecord } from '@/server/inProcess/actions'
import type { FormActionState } from '@/server/batches/actions'

function toLocalInputValue(d: Date | null | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function CureRecordForm({
  batchRecordId,
  phase,
  existing,
}: {
  batchRecordId: string
  phase: 'PRE_CUT' | 'POST_CUT'
  existing?: {
    dateTimeStart: Date | null
    targetCureDuration: string | null
    dateTimeRemoved: Date | null
    curingLocationConditions: string | null
    curePeriodAcceptable: boolean | null
    phMeasurementDateTime: Date | null
    phResult: unknown
    freeCausticCheckMethod: string | null
    freeCausticCheckResult: string | null
  }
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveCureRecord, undefined)
  const inputClass = 'rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <input type="hidden" name="phase" value={phase} />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor={`dateTimeStart-${phase}`}>
            {phase === 'PRE_CUT' ? 'Date/Time Poured into Molds' : 'Date/Time Cut'}
          </label>
          <input
            id={`dateTimeStart-${phase}`}
            name="dateTimeStart"
            type="datetime-local"
            defaultValue={toLocalInputValue(existing?.dateTimeStart)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor={`targetCureDuration-${phase}`}>Target Cure Duration</label>
          <input
            id={`targetCureDuration-${phase}`}
            name="targetCureDuration"
            defaultValue={existing?.targetCureDuration ?? ''}
            className={inputClass}
          />
        </div>
      </div>

      {phase === 'PRE_CUT' && (
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="dateTimeRemoved">Date/Time Removed from Molds</label>
          <input
            id="dateTimeRemoved"
            name="dateTimeRemoved"
            type="datetime-local"
            defaultValue={toLocalInputValue(existing?.dateTimeRemoved)}
            className={inputClass}
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor={`curingLocationConditions-${phase}`}>Curing Location / Conditions</label>
        <input
          id={`curingLocationConditions-${phase}`}
          name="curingLocationConditions"
          defaultValue={existing?.curingLocationConditions ?? ''}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="curePeriodAcceptable" defaultChecked={existing?.curePeriodAcceptable ?? false} className="h-4 w-4" />
        Cure period acceptable
      </label>

      {phase === 'POST_CUT' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="phMeasurementDateTime">pH Measured (date/time)</label>
              <input
                id="phMeasurementDateTime"
                name="phMeasurementDateTime"
                type="datetime-local"
                defaultValue={toLocalInputValue(existing?.phMeasurementDateTime)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="phResult">pH Result</label>
              <input
                id="phResult"
                name="phResult"
                type="number"
                step="0.01"
                defaultValue={existing?.phResult != null ? String(existing.phResult) : ''}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="freeCausticCheckMethod">Free Caustic Check Method</label>
              <input
                id="freeCausticCheckMethod"
                name="freeCausticCheckMethod"
                defaultValue={existing?.freeCausticCheckMethod ?? ''}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="freeCausticCheckResult">Free Caustic Check Result</label>
              <input
                id="freeCausticCheckResult"
                name="freeCausticCheckResult"
                defaultValue={existing?.freeCausticCheckResult ?? ''}
                className={inputClass}
              />
            </div>
          </div>
        </>
      )}

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
