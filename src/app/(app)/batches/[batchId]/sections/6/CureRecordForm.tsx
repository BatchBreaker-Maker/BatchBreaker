'use client'

import { useActionState } from 'react'
import { saveCureRecord } from '@/server/inProcess/actions'
import type { FormActionState } from '@/server/batches/actions'
import { Button, Input, Label } from '@/components/ui'

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
    // Pre-converted to string by the server page — Prisma's Decimal can't
    // cross the Server -> Client Component boundary as a prop.
    phResult: string | null
    freeCausticCheckMethod: string | null
    freeCausticCheckResult: string | null
  }
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveCureRecord, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <input type="hidden" name="phase" value={phase} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`dateTimeStart-${phase}`}>
            {phase === 'PRE_CUT' ? 'Date/Time Poured into Molds' : 'Date/Time Cut'}
          </Label>
          <Input
            id={`dateTimeStart-${phase}`}
            name="dateTimeStart"
            type="datetime-local"
            defaultValue={toLocalInputValue(existing?.dateTimeStart)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`targetCureDuration-${phase}`}>Target Cure Duration</Label>
          <Input
            id={`targetCureDuration-${phase}`}
            name="targetCureDuration"
            defaultValue={existing?.targetCureDuration ?? ''}
          />
        </div>
      </div>

      {phase === 'PRE_CUT' && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="dateTimeRemoved">Date/Time Removed from Molds</Label>
          <Input
            id="dateTimeRemoved"
            name="dateTimeRemoved"
            type="datetime-local"
            defaultValue={toLocalInputValue(existing?.dateTimeRemoved)}
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor={`curingLocationConditions-${phase}`}>Curing Location / Conditions</Label>
        <Input
          id={`curingLocationConditions-${phase}`}
          name="curingLocationConditions"
          defaultValue={existing?.curingLocationConditions ?? ''}
        />
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          name="curePeriodAcceptable"
          defaultChecked={existing?.curePeriodAcceptable ?? false}
          className="h-4 w-4 shrink-0"
        />
        Cure period acceptable
      </label>

      {phase === 'POST_CUT' && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="phMeasurementDateTime">pH Measured (date/time)</Label>
              <Input
                id="phMeasurementDateTime"
                name="phMeasurementDateTime"
                type="datetime-local"
                defaultValue={toLocalInputValue(existing?.phMeasurementDateTime)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="phResult">pH Result</Label>
              <Input id="phResult" name="phResult" type="number" step="0.01" defaultValue={existing?.phResult ?? ''} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="freeCausticCheckMethod">Free Caustic Check Method</Label>
              <Input
                id="freeCausticCheckMethod"
                name="freeCausticCheckMethod"
                defaultValue={existing?.freeCausticCheckMethod ?? ''}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="freeCausticCheckResult">Free Caustic Check Result</Label>
              <Input
                id="freeCausticCheckResult"
                name="freeCausticCheckResult"
                defaultValue={existing?.freeCausticCheckResult ?? ''}
              />
            </div>
          </div>
        </>
      )}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}
