'use client'

import { useActionState } from 'react'
import { addCuttingObservation } from '@/server/cutting/actions'
import type { FormActionState } from '@/server/batches/actions'
import { Button, Card, Input, Label, Textarea } from '@/components/ui'

export function CuttingObservationForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addCuttingObservation, undefined)

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />
        <h3 className="text-sm font-semibold text-text">Add pour observation</h3>

        <div className="flex flex-col gap-1">
          <Label htmlFor="pourNumber">Pour #</Label>
          <Input id="pourNumber" name="pourNumber" type="number" min="1" required />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="tempTopF">Temp — Top (°F)</Label>
            <Input id="tempTopF" name="tempTopF" type="number" step="0.1" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="tempSideF">Temp — Side (°F)</Label>
            <Input id="tempSideF" name="tempSideF" type="number" step="0.1" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="tempMiddleF">Temp — Middle (°F)</Label>
            <Input id="tempMiddleF" name="tempMiddleF" type="number" step="0.1" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="colorUniformity">Color Uniformity</Label>
          <Input id="colorUniformity" name="colorUniformity" />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex min-h-11 items-center gap-2 text-sm text-text">
            <input type="checkbox" name="visibleSeparation" className="h-4 w-4 shrink-0" /> Visible separation?
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-text">
            <input type="checkbox" name="foreignMatter" className="h-4 w-4 shrink-0" /> Foreign matter?
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="fragranceAdditionalComments">Fragrance / Additional Comments</Label>
          <Textarea id="fragranceAdditionalComments" name="fragranceAdditionalComments" rows={2} />
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Adding…' : 'Add observation'}
        </Button>
      </form>
    </Card>
  )
}
