'use client'

import { useActionState } from 'react'
import { saveEquipmentVerification } from '@/server/equipment/actions'
import type { FormActionState } from '@/server/batches/actions'
import { EQUIPMENT_ROW_LABELS, EQUIPMENT_ROW_ORDER } from '@/lib/workflow/equipmentLabels'
import type { EquipmentVerificationModel } from '@/generated/prisma/models'
import type { EquipmentRowKey } from '@/generated/prisma/enums'

export function EquipmentVerificationForm({
  batchRecordId,
  existingByRow,
}: {
  batchRecordId: string
  existingByRow: Partial<Record<EquipmentRowKey, EquipmentVerificationModel>>
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveEquipmentVerification, undefined)
  const inputClass = 'rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900'

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
              <th className="py-2 pr-3">Equipment</th>
              <th className="py-2 pr-3">Equipment ID</th>
              <th className="py-2 pr-3">Cleaned &amp; Verified</th>
              <th className="py-2 pr-3">Calibration Current</th>
            </tr>
          </thead>
          <tbody>
            {EQUIPMENT_ROW_ORDER.map((rowKey) => {
              const existing = existingByRow[rowKey]
              return (
                <tr key={rowKey} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-3">{EQUIPMENT_ROW_LABELS[rowKey]}</td>
                  <td className="py-2 pr-3">
                    <input
                      name={`${rowKey}__equipmentId`}
                      defaultValue={existing?.equipmentId ?? ''}
                      className={inputClass}
                      placeholder="ID / notes"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      name={`${rowKey}__cleaned`}
                      defaultChecked={existing?.cleanedAndVerified ?? false}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      name={`${rowKey}__calibration`}
                      defaultChecked={existing?.calibrationCurrent ?? false}
                      className="h-4 w-4"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save verification'}
      </button>
    </form>
  )
}
