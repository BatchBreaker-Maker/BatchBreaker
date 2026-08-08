'use client'

import { useActionState } from 'react'
import { assignBatchPersonnel, type FormActionState } from '@/server/batches/actions'
import { Button, Card, Input, Label, Textarea } from '@/components/ui'

export function PersonnelForm({
  batchRecordId,
  current,
}: {
  batchRecordId: string
  current: { productionOperatorNames: string[]; headOfProductionName: string | null; qcReviewerName: string | null }
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(assignBatchPersonnel, undefined)

  return (
    <Card className="w-full max-w-md">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="batchRecordId" value={batchRecordId} />

        <div className="flex flex-col gap-1">
          <Label htmlFor="productionOperatorNames">Production Operator(s)</Label>
          <Textarea
            id="productionOperatorNames"
            name="productionOperatorNames"
            rows={3}
            placeholder="One name per line"
            defaultValue={(current.productionOperatorNames ?? []).join('\n')}
            required
          />
          <p className="text-xs text-text-muted">Enter one name per line — any number of operators can be listed.</p>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="headOfProductionName">Head of Production</Label>
          <Input
            id="headOfProductionName"
            name="headOfProductionName"
            defaultValue={current.headOfProductionName ?? ''}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="qcReviewerName">QC Reviewer</Label>
          <Input id="qcReviewerName" name="qcReviewerName" defaultValue={current.qcReviewerName ?? ''} required />
          <p className="text-xs text-text-muted">Must be a different person than the operator(s) or Head of Production.</p>
        </div>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Saving…' : 'Save personnel'}
        </Button>
      </form>
    </Card>
  )
}
