'use client'

import { useState } from 'react'
import { Badge, Input, Label, TBody, TD, TH, THead, TR, Table } from '@/components/ui'
import { correctPressRun } from '@/server/stamping/actions'
import { CorrectionModal } from '@/components/workflow/CorrectionModal'
import type { PressRun } from '@/generated/prisma/client'

type RunWithCorrections = PressRun & { correctedByEntries: { id: string }[] }

export function PressRunLogTable({
  runs,
  batchRecordId,
  canCorrect,
}: {
  runs: RunWithCorrections[]
  batchRecordId: string
  canCorrect: boolean
}) {
  const [correcting, setCorrecting] = useState<RunWithCorrections | null>(null)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Table>
        <THead>
          <TR>
            <TH>Date/Time</TH>
            <TH>Die/Stamp</TH>
            <TH>Impression</TH>
            <TH>Surface</TH>
            <TH>OK?</TH>
          </TR>
        </THead>
        <TBody>
          {runs.map((r) => {
            const superseded = r.correctedByEntries.length > 0
            const clickable = canCorrect && !superseded
            return (
              <TR
                key={r.id}
                onClick={clickable ? () => setCorrecting(r) : undefined}
                title={clickable ? 'Click to correct this entry' : undefined}
                className={clickable ? 'cursor-pointer hover:bg-surface-hover' : ''}
              >
                <TD className={superseded ? 'text-text-muted line-through' : ''}>
                  {r.dateTime.toISOString().slice(0, 16).replace('T', ' ')}
                  {r.correctsEntryId && (
                    <Badge status="accent" className="ml-2">
                      Correction
                    </Badge>
                  )}
                  {superseded && (
                    <Badge status="neutral" className="ml-2">
                      Corrected
                    </Badge>
                  )}
                </TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{r.dieStampId}</TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{r.impressionQuality || '—'}</TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{r.barSurfaceCondition || '—'}</TD>
                <TD
                  className={
                    superseded ? 'text-text-muted line-through' : !r.appearanceOk ? 'font-medium text-danger' : ''
                  }
                >
                  {r.appearanceOk ? 'Yes' : 'No'}
                </TD>
              </TR>
            )
          })}
        </TBody>
      </Table>
      {runs.length === 0 && <p className="mt-2 text-sm text-text-muted">No press runs logged yet.</p>}

      {correcting && (
        <CorrectionModal
          open={!!correcting}
          onClose={() => setCorrecting(null)}
          title="Correct press run"
          action={correctPressRun}
          hiddenFields={{ batchRecordId, correctsEntryId: correcting.id }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="dateTime">Date/Time</Label>
              <Input
                id="dateTime"
                name="dateTime"
                type="datetime-local"
                defaultValue={correcting.dateTime.toISOString().slice(0, 16)}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="pressRunDieStampId">Die / Stamp ID</Label>
              <Input id="pressRunDieStampId" name="dieStampId" defaultValue={correcting.dieStampId} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="impressionQuality">Impression Quality</Label>
              <Input id="impressionQuality" name="impressionQuality" defaultValue={correcting.impressionQuality ?? ''} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="barSurfaceCondition">Bar Surface Condition</Label>
              <Input
                id="barSurfaceCondition"
                name="barSurfaceCondition"
                defaultValue={correcting.barSurfaceCondition ?? ''}
              />
            </div>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              name="appearanceOk"
              defaultChecked={correcting.appearanceOk}
              className="h-4 w-4 shrink-0"
            />
            Appearance OK
          </label>
        </CorrectionModal>
      )}
    </div>
  )
}
