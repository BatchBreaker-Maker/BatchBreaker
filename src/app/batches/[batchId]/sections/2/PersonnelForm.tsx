'use client'

import { useActionState } from 'react'
import { assignBatchPersonnel, type FormActionState } from '@/server/batches/actions'

type UserOption = { id: string; fullName: string }

export function PersonnelForm({
  batchRecordId,
  operators,
  headsOfProduction,
  qcReviewers,
  current,
}: {
  batchRecordId: string
  operators: UserOption[]
  headsOfProduction: UserOption[]
  qcReviewers: UserOption[]
  current: { operatorUserId?: string; headOfProductionUserId?: string; qcReviewerUserId?: string }
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(assignBatchPersonnel, undefined)
  const selectClass = 'rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900'

  return (
    <form action={formAction} className="flex flex-col gap-4 w-full max-w-md">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="operatorUserId">Production Operator</label>
        <select id="operatorUserId" name="operatorUserId" className={selectClass} defaultValue={current.operatorUserId} required>
          <option value="" disabled>Select…</option>
          {operators.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="headOfProductionUserId">Head of Production</label>
        <select id="headOfProductionUserId" name="headOfProductionUserId" className={selectClass} defaultValue={current.headOfProductionUserId} required>
          <option value="" disabled>Select…</option>
          {headsOfProduction.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="qcReviewerUserId">QC Reviewer</label>
        <select id="qcReviewerUserId" name="qcReviewerUserId" className={selectClass} defaultValue={current.qcReviewerUserId} required>
          <option value="" disabled>Select…</option>
          {qcReviewers.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save personnel'}
      </button>
    </form>
  )
}
