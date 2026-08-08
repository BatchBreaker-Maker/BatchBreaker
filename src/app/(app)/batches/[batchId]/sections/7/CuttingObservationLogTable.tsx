'use client'

import { useState } from 'react'
import { Badge, Input, Label, TBody, TD, TH, THead, TR, Table, Textarea } from '@/components/ui'
import { correctCuttingObservation } from '@/server/cutting/actions'
import { CorrectionModal } from '@/components/workflow/CorrectionModal'
import type { CuttingObservation } from '@/generated/prisma/client'

// tempTopF/tempSideF/tempMiddleF are pre-converted to string|null by the
// server page — Prisma's Decimal can't cross into a Client Component as a
// prop.
type ObservationWithCorrections = Omit<CuttingObservation, 'tempTopF' | 'tempSideF' | 'tempMiddleF'> & {
  tempTopF: string | null
  tempSideF: string | null
  tempMiddleF: string | null
  correctedByEntries: { id: string }[]
}

export function CuttingObservationLogTable({
  observations,
  batchRecordId,
  canCorrect,
}: {
  observations: ObservationWithCorrections[]
  batchRecordId: string
  canCorrect: boolean
}) {
  const [correcting, setCorrecting] = useState<ObservationWithCorrections | null>(null)

  return (
    <div className="max-w-5xl">
      <Table>
        <THead>
          <TR>
            <TH>Pour</TH>
            <TH>Top</TH>
            <TH>Side</TH>
            <TH>Middle</TH>
            <TH>Color</TH>
            <TH>Separation?</TH>
            <TH>Foreign Matter?</TH>
            <TH>Comments</TH>
          </TR>
        </THead>
        <TBody>
          {observations.map((o) => {
            const superseded = o.correctedByEntries.length > 0
            const clickable = canCorrect && !superseded
            return (
              <TR
                key={o.id}
                onClick={clickable ? () => setCorrecting(o) : undefined}
                title={clickable ? 'Click to correct this entry' : undefined}
                className={clickable ? 'cursor-pointer hover:bg-surface-hover' : ''}
              >
                <TD className={superseded ? 'text-text-muted line-through' : ''}>
                  {o.pourNumber}
                  {o.correctsEntryId && (
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
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{o.tempTopF ?? '—'}</TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{o.tempSideF ?? '—'}</TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{o.tempMiddleF ?? '—'}</TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{o.colorUniformity || '—'}</TD>
                <TD
                  className={
                    superseded ? 'text-text-muted line-through' : o.visibleSeparation ? 'font-medium text-danger' : ''
                  }
                >
                  {o.visibleSeparation ? 'Yes' : 'No'}
                </TD>
                <TD
                  className={
                    superseded ? 'text-text-muted line-through' : o.foreignMatter ? 'font-medium text-danger' : ''
                  }
                >
                  {o.foreignMatter ? 'Yes' : 'No'}
                </TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{o.fragranceAdditionalComments || '—'}</TD>
              </TR>
            )
          })}
        </TBody>
      </Table>
      {observations.length === 0 && <p className="mt-2 text-sm text-text-muted">No cutting observations yet.</p>}

      {correcting && (
        <CorrectionModal
          open={!!correcting}
          onClose={() => setCorrecting(null)}
          title={`Correct pour #${correcting.pourNumber} observation`}
          action={correctCuttingObservation}
          hiddenFields={{
            batchRecordId,
            correctsEntryId: correcting.id,
            // pourNumber is required by the correction schema even though
            // the server keeps original.pourNumber authoritative — a
            // correction can't change which pour it's for.
            pourNumber: String(correcting.pourNumber),
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="tempTopF">Temp — Top (°F)</Label>
              <Input id="tempTopF" name="tempTopF" type="number" step="0.1" defaultValue={correcting.tempTopF ?? ''} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="tempSideF">Temp — Side (°F)</Label>
              <Input id="tempSideF" name="tempSideF" type="number" step="0.1" defaultValue={correcting.tempSideF ?? ''} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="tempMiddleF">Temp — Middle (°F)</Label>
              <Input
                id="tempMiddleF"
                name="tempMiddleF"
                type="number"
                step="0.1"
                defaultValue={correcting.tempMiddleF ?? ''}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="colorUniformity">Color Uniformity</Label>
            <Input id="colorUniformity" name="colorUniformity" defaultValue={correcting.colorUniformity ?? ''} />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex min-h-11 items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                name="visibleSeparation"
                defaultChecked={correcting.visibleSeparation}
                className="h-4 w-4 shrink-0"
              />{' '}
              Visible separation?
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                name="foreignMatter"
                defaultChecked={correcting.foreignMatter}
                className="h-4 w-4 shrink-0"
              />{' '}
              Foreign matter?
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="fragranceAdditionalComments">Fragrance / Additional Comments</Label>
            <Textarea
              id="fragranceAdditionalComments"
              name="fragranceAdditionalComments"
              rows={2}
              defaultValue={correcting.fragranceAdditionalComments ?? ''}
            />
          </div>
        </CorrectionModal>
      )}
    </div>
  )
}
