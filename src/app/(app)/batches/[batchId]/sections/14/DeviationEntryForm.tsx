'use client'

import { useActionState } from 'react'
import { addDeviationEntry } from '@/server/deviations/actions'
import type { FormActionState } from '@/server/batches/actions'
import { useDefaultDateTimeLocal } from '@/lib/dateInputDefaults'
import { Button, Card, Input, Label, Select, Textarea } from '@/components/ui'

type UserOption = { id: string; fullName: string }

export function DeviationEntryForm({ batchRecordId, users }: { batchRecordId: string; users: UserOption[] }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(addDeviationEntry, undefined)
  const defaultDateTime = useDefaultDateTimeLocal()

  return (
    <Card className="w-full">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />
        <h3 className="text-sm font-semibold text-text">Log a deviation / incident</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="dateTime">Date/Time</Label>
            <Input id="dateTime" name="dateTime" type="datetime-local" defaultValue={defaultDateTime} required />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="type">Type</Label>
            <Select id="type" name="type" required defaultValue="">
              <option value="" disabled>
                Select…
              </option>
              <option value="INCIDENT">Incident</option>
              <option value="DEVIATION">Deviation</option>
              <option value="CRITICAL_DEVIATION">Critical Deviation</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={3} required />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="correctiveActionTaken">Corrective Action Taken</Label>
          <Textarea id="correctiveActionTaken" name="correctiveActionTaken" rows={2} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="reportedToUserId">Reported To</Label>
          <Select id="reportedToUserId" name="reportedToUserId" defaultValue="">
            <option value="">(none)</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </Select>
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Logging…' : 'Log deviation'}
        </Button>
      </form>
    </Card>
  )
}
