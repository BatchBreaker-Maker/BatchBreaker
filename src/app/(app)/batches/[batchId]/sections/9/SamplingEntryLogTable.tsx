'use client'

import { useState } from 'react'
import type { BadgeStatus } from '@/components/ui'
import { Badge, Input, Label, Select, TBody, TD, TH, THead, TR, Table, Textarea } from '@/components/ui'
import { correctSamplingEntry } from '@/server/sampling/actions'
import { CorrectionModal } from '@/components/workflow/CorrectionModal'
import type { SamplingEntry } from '@/generated/prisma/client'
import type { DispositionType } from '@/generated/prisma/enums'

type EntryWithCorrections = SamplingEntry & { correctedByEntries: { id: string }[] }

const DISPOSITION_BADGE: Record<DispositionType, BadgeStatus> = {
  TESTED_RELEASED: 'success',
  RETAINED: 'warning',
  DISCARDED: 'danger',
}

export function SamplingEntryLogTable({
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
    <div className="mx-auto w-full max-w-4xl">
      <Table>
        <THead>
          <TR>
            <TH>Date/Time</TH>
            <TH>Stage</TH>
            <TH>Test Type</TH>
            <TH>Result</TH>
            <TH>Disposition</TH>
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
                <TD className={superseded ? 'text-text-muted line-through' : ''}>
                  {e.dateTime.toISOString().slice(0, 16).replace('T', ' ')}
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
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{e.samplingStage}</TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{e.testType}</TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{e.resultObservation || '—'}</TD>
                <TD>
                  {superseded ? (
                    <span className="text-text-muted line-through">{e.disposition.replaceAll('_', ' ')}</span>
                  ) : (
                    <Badge status={DISPOSITION_BADGE[e.disposition]}>{e.disposition.replaceAll('_', ' ')}</Badge>
                  )}
                </TD>
              </TR>
            )
          })}
        </TBody>
      </Table>
      {entries.length === 0 && <p className="mt-2 text-sm text-text-muted">No sampling entries yet.</p>}

      {correcting && (
        <CorrectionModal
          open={!!correcting}
          onClose={() => setCorrecting(null)}
          title="Correct sampling entry"
          action={correctSamplingEntry}
          hiddenFields={{ batchRecordId, correctsEntryId: correcting.id }}
        >
          <SamplingCorrectionFields entry={correcting} />
        </CorrectionModal>
      )}
    </div>
  )
}

// A fresh instance mounts each time `correcting` flips from null to an
// entry (see the parent's `{correcting && <CorrectionModal>...}` guard), so
// this local disposition state always initializes from the right entry.
function SamplingCorrectionFields({ entry }: { entry: EntryWithCorrections }) {
  const [disposition, setDisposition] = useState<DispositionType>(entry.disposition)

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="dateTime">Date/Time</Label>
          <Input
            id="dateTime"
            name="dateTime"
            type="datetime-local"
            defaultValue={entry.dateTime.toISOString().slice(0, 16)}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="samplingStage">Sampling Stage</Label>
          <Input id="samplingStage" name="samplingStage" defaultValue={entry.samplingStage} required />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="testType">Test Type</Label>
        <Input id="testType" name="testType" defaultValue={entry.testType} required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="resultObservation">Result / Observation</Label>
        <Textarea id="resultObservation" name="resultObservation" rows={2} defaultValue={entry.resultObservation ?? ''} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="actionTaken">Action Taken</Label>
        <Textarea id="actionTaken" name="actionTaken" rows={2} defaultValue={entry.actionTaken ?? ''} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="disposition">Disposition</Label>
        <Select
          id="disposition"
          name="disposition"
          value={disposition}
          onChange={(e) => setDisposition(e.target.value as DispositionType)}
        >
          <option value="TESTED_RELEASED">Tested &amp; Released</option>
          <option value="RETAINED">Retained</option>
          <option value="DISCARDED">Discarded</option>
        </Select>
      </div>

      {disposition === 'DISCARDED' && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="dispositionReason">Reason for Discarding</Label>
          <Input id="dispositionReason" name="dispositionReason" defaultValue={entry.dispositionReason ?? ''} required />
        </div>
      )}
    </>
  )
}
