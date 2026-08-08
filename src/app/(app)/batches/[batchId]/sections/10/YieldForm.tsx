'use client'

import { useActionState } from 'react'
import { saveYieldReconciliation } from '@/server/yield/actions'
import type { FormActionState } from '@/server/batches/actions'
import type { YieldReconciliationModel } from '@/generated/prisma/models'
import { Button, Card, Input, Label, Textarea } from '@/components/ui'

export function YieldForm({ batchRecordId, existing }: { batchRecordId: string; existing: YieldReconciliationModel | null }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveYieldReconciliation, undefined)

  return (
    <Card className="w-full max-w-lg">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="expectedYield">Expected Yield</Label>
            <Input
              id="expectedYield"
              name="expectedYield"
              type="number"
              step="0.001"
              defaultValue={existing?.expectedYield?.toString()}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="expectedYieldUnit">Unit</Label>
            <Input id="expectedYieldUnit" name="expectedYieldUnit" defaultValue={existing?.expectedYieldUnit ?? ''} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="actualYield">Actual Yield</Label>
            <Input
              id="actualYield"
              name="actualYield"
              type="number"
              step="0.001"
              defaultValue={existing?.actualYield?.toString()}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="actualYieldUnit">Unit</Label>
            <Input id="actualYieldUnit" name="actualYieldUnit" defaultValue={existing?.actualYieldUnit ?? ''} required />
          </div>
        </div>

        <label className="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm text-text hover:bg-surface-hover">
          <input
            type="checkbox"
            name="varianceAcceptable"
            defaultChecked={existing?.varianceAcceptable ?? true}
            className="h-4 w-4 shrink-0"
          />
          Variance acceptable
        </label>

        <label className="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm text-text hover:bg-surface-hover">
          <input
            type="checkbox"
            name="investigationInitiated"
            defaultChecked={existing?.investigationInitiated ?? false}
            className="h-4 w-4 shrink-0"
          />
          Investigation initiated (required if variance not acceptable)
        </label>

        <div className="flex flex-col gap-1">
          <Label htmlFor="notesDisposition">Notes / Disposition</Label>
          <Textarea id="notesDisposition" name="notesDisposition" rows={2} defaultValue={existing?.notesDisposition ?? ''} />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </Card>
  )
}
