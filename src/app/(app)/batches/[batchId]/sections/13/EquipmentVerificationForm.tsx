'use client'

import { useActionState } from 'react'
import { saveEquipmentVerification } from '@/server/equipment/actions'
import type { FormActionState } from '@/server/batches/actions'
import { EQUIPMENT_ROW_LABELS, EQUIPMENT_ROW_ORDER } from '@/lib/workflow/equipmentLabels'
import type { EquipmentVerificationModel } from '@/generated/prisma/models'
import type { EquipmentRowKey } from '@/generated/prisma/enums'
import { Button, Input, TBody, TD, TH, THead, TR, Table } from '@/components/ui'

export function EquipmentVerificationForm({
  batchRecordId,
  existingByRow,
}: {
  batchRecordId: string
  existingByRow: Partial<Record<EquipmentRowKey, EquipmentVerificationModel>>
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(saveEquipmentVerification, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />

      <Table>
        <THead>
          <TR>
            <TH>Equipment</TH>
            <TH>Equipment ID</TH>
            <TH>Cleaned &amp; Verified</TH>
            <TH>Calibration Current</TH>
          </TR>
        </THead>
        <TBody>
          {EQUIPMENT_ROW_ORDER.map((rowKey) => {
            const existing = existingByRow[rowKey]
            return (
              <TR key={rowKey}>
                <TD>{EQUIPMENT_ROW_LABELS[rowKey]}</TD>
                <TD>
                  <Input
                    name={`${rowKey}__equipmentId`}
                    defaultValue={existing?.equipmentId ?? ''}
                    placeholder="ID / notes"
                    className="min-w-40"
                  />
                </TD>
                <TD>
                  <input
                    type="checkbox"
                    name={`${rowKey}__cleaned`}
                    defaultChecked={existing?.cleanedAndVerified ?? false}
                    className="h-4 w-4 shrink-0"
                  />
                </TD>
                <TD>
                  <input
                    type="checkbox"
                    name={`${rowKey}__calibration`}
                    defaultChecked={existing?.calibrationCurrent ?? false}
                    className="h-4 w-4 shrink-0"
                  />
                </TD>
              </TR>
            )
          })}
        </TBody>
      </Table>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Saving…' : 'Save verification'}
      </Button>
    </form>
  )
}
