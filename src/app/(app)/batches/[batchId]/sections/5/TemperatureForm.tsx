'use client'

import { useActionState } from 'react'
import { addTemperatureEntry } from '@/server/temperatures/actions'
import type { FormActionState } from '@/server/batches/actions'
import { useDefaultDateTimeLocal } from '@/lib/dateInputDefaults'
import { Button, Card, Input, Label } from '@/components/ui'

export function TemperatureForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addTemperatureEntry, undefined)
  const defaultTimeOfAddition = useDefaultDateTimeLocal()

  return (
    <Card className="mx-auto w-full max-w-xl">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />
        <h3 className="text-sm font-semibold text-text">Add temperature entry</h3>

        <div className="flex flex-col gap-1">
          <Label htmlFor="materialIngredient">Material / Ingredient</Label>
          <Input id="materialIngredient" name="materialIngredient" required />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="acceptableTempMinF">Acceptable Min (°F)</Label>
            <Input id="acceptableTempMinF" name="acceptableTempMinF" type="number" step="0.1" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="acceptableTempMaxF">Acceptable Max (°F)</Label>
            <Input id="acceptableTempMaxF" name="acceptableTempMaxF" type="number" step="0.1" required />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="actualTempF">Actual Temp at Addition (°F)</Label>
            <Input id="actualTempF" name="actualTempF" type="number" step="0.1" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="timeOfAddition">Time of Addition</Label>
            <Input
              id="timeOfAddition"
              name="timeOfAddition"
              type="datetime-local"
              defaultValue={defaultTimeOfAddition}
              required
            />
          </div>
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Adding…' : 'Add entry'}
        </Button>
      </form>
    </Card>
  )
}
