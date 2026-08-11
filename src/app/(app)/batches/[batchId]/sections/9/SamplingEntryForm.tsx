'use client'

import { useActionState, useState } from 'react'
import { addSamplingEntry } from '@/server/sampling/actions'
import type { FormActionState } from '@/server/batches/actions'
import { useDefaultDateTimeLocal } from '@/lib/dateInputDefaults'
import { Button, Card, Input, Label, Select, Textarea } from '@/components/ui'

export function SamplingEntryForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addSamplingEntry, undefined)
  const [disposition, setDisposition] = useState('TESTED_RELEASED')
  const defaultDateTime = useDefaultDateTimeLocal()

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />
        <h3 className="text-sm font-semibold text-text">Add sampling entry</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="dateTime">Date/Time</Label>
            <Input id="dateTime" name="dateTime" type="datetime-local" defaultValue={defaultDateTime} required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="samplingStage">Sampling Stage</Label>
            <Input id="samplingStage" name="samplingStage" required />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="testType">Test Type</Label>
          <Input id="testType" name="testType" placeholder="visual, odor, etc." required />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="resultObservation">Result / Observation</Label>
          <Textarea id="resultObservation" name="resultObservation" rows={2} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="actionTaken">Action Taken</Label>
          <Textarea id="actionTaken" name="actionTaken" rows={2} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="disposition">Disposition</Label>
          <Select id="disposition" name="disposition" value={disposition} onChange={(e) => setDisposition(e.target.value)}>
            <option value="TESTED_RELEASED">Tested &amp; Released</option>
            <option value="RETAINED">Retained</option>
            <option value="DISCARDED">Discarded</option>
          </Select>
        </div>

        {disposition === 'DISCARDED' && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="dispositionReason">Reason for Discarding</Label>
            <Input id="dispositionReason" name="dispositionReason" required />
          </div>
        )}

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Adding…' : 'Add entry'}
        </Button>
      </form>
    </Card>
  )
}
