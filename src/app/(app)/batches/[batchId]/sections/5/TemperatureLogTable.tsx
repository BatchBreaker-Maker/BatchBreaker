'use client'

import { useState } from 'react'
import { Badge, TBody, TD, TH, THead, TR, Table } from '@/components/ui'
import { correctTemperatureEntry } from '@/server/temperatures/actions'
import { CorrectionModal } from '@/components/workflow/CorrectionModal'
import { Input, Label } from '@/components/ui'
import type { TemperatureEntry } from '@/generated/prisma/client'

// acceptableTempMinF/acceptableTempMaxF/actualTempF are pre-converted to
// string by the server page — Prisma's Decimal can't cross into a Client
// Component as a prop.
type EntryWithCorrections = Omit<TemperatureEntry, 'acceptableTempMinF' | 'acceptableTempMaxF' | 'actualTempF'> & {
  acceptableTempMinF: string
  acceptableTempMaxF: string
  actualTempF: string
  correctedByEntries: { id: string }[]
}

export function TemperatureLogTable({
  entries,
  batchRecordId,
  canCorrect,
}: {
  entries: EntryWithCorrections[]
  batchRecordId: string
  canCorrect: boolean
}) {
  const [correcting, setCorrecting] = useState<EntryWithCorrections | null>(null)

  return (
    <div className="max-w-3xl">
      <Table>
        <THead>
          <TR>
            <TH>#</TH>
            <TH>Material</TH>
            <TH>Acceptable Range</TH>
            <TH>Actual</TH>
            <TH>Within Range?</TH>
            <TH>Time</TH>
          </TR>
        </THead>
        <TBody>
          {entries.map((e) => {
            const superseded = e.correctedByEntries.length > 0
            const clickable = canCorrect && !superseded
            return (
              <TR
                key={e.id}
                onClick={clickable ? () => setCorrecting(e) : undefined}
                title={clickable ? 'Click to correct this entry' : undefined}
                className={clickable ? 'cursor-pointer hover:bg-surface-hover' : ''}
              >
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{e.lineNumber}</TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>
                  {e.materialIngredient}
                  {e.correctsEntryId && (
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
                <TD className={superseded ? 'text-text-muted line-through' : ''}>
                  {e.acceptableTempMinF}–{e.acceptableTempMaxF}°F
                </TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{e.actualTempF}°F</TD>
                <TD>
                  <span className={!e.withinRange ? 'font-medium text-danger' : superseded ? 'text-text-muted line-through' : ''}>
                    {e.withinRange ? 'Yes' : 'OUT OF RANGE'}
                  </span>
                </TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>
                  {e.timeOfAddition.toISOString().slice(0, 16).replace('T', ' ')}
                </TD>
              </TR>
            )
          })}
        </TBody>
      </Table>
      {entries.length === 0 && <p className="mt-2 text-sm text-text-muted">No temperature entries yet.</p>}

      {correcting && (
        <CorrectionModal
          open={!!correcting}
          onClose={() => setCorrecting(null)}
          title={`Correct temperature entry #${correcting.lineNumber}`}
          action={correctTemperatureEntry}
          hiddenFields={{ batchRecordId, correctsEntryId: correcting.id }}
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="materialIngredient">Material / Ingredient</Label>
            <Input id="materialIngredient" name="materialIngredient" defaultValue={correcting.materialIngredient} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="acceptableTempMinF">Acceptable Min (°F)</Label>
              <Input
                id="acceptableTempMinF"
                name="acceptableTempMinF"
                type="number"
                step="0.1"
                defaultValue={correcting.acceptableTempMinF}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="acceptableTempMaxF">Acceptable Max (°F)</Label>
              <Input
                id="acceptableTempMaxF"
                name="acceptableTempMaxF"
                type="number"
                step="0.1"
                defaultValue={correcting.acceptableTempMaxF}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="actualTempF">Actual Temp at Addition (°F)</Label>
              <Input
                id="actualTempF"
                name="actualTempF"
                type="number"
                step="0.1"
defaultValue={correcting.actualTempF}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="timeOfAddition">Time of Addition</Label>
              <Input
                id="timeOfAddition"
                name="timeOfAddition"
                type="datetime-local"
                defaultValue={correcting.timeOfAddition.toISOString().slice(0, 16)}
                required
              />
            </div>
          </div>
        </CorrectionModal>
      )}
    </div>
  )
}
