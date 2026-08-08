'use client'

import { useState } from 'react'
import type { BadgeStatus } from '@/components/ui'
import { Badge, Input, Label, Select, TBody, TD, TH, THead, TR, Table, Textarea } from '@/components/ui'
import { correctRawMaterialEntry } from '@/server/rawMaterials/actions'
import { CorrectionModal } from '@/components/workflow/CorrectionModal'
import type { RawMaterialEntry } from '@/generated/prisma/client'
import type { SupplierQualStatus } from '@/generated/prisma/enums'

// qtyDispensed is pre-converted to string by the server page — Prisma's
// Decimal can't cross into a Client Component as a prop.
type EntryWithCorrections = Omit<RawMaterialEntry, 'qtyDispensed'> & {
  qtyDispensed: string
  correctedByEntries: { id: string }[]
}

const QUAL_BADGE_STATUS: Record<SupplierQualStatus, BadgeStatus> = {
  APPROVED: 'success',
  CONDITIONAL: 'warning',
  BLOCKED: 'danger',
}

export function RawMaterialLogTable({
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
    <div className="max-w-5xl">
      <Table>
        <THead>
          <TR>
            <TH>#</TH>
            <TH>Trade Name / Description</TH>
            <TH>Part Code</TH>
            <TH>Supplier</TH>
            <TH>Lot #</TH>
            <TH>Qty</TH>
            <TH>COA</TH>
            <TH>Qual. Status</TH>
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
                  {e.tradeNameDescription}
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
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{e.internalPartCode || '—'}</TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{e.supplierName}</TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{e.supplierLotBatchNumber}</TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>
                  {e.qtyDispensed} {e.unit}
                </TD>
                <TD className={superseded ? 'text-text-muted line-through' : ''}>{e.coaReceived ? 'Yes' : 'No'}</TD>
                <TD>
                  {superseded ? (
                    <span className="text-text-muted line-through">{e.supplierQualStatus}</span>
                  ) : (
                    <Badge status={QUAL_BADGE_STATUS[e.supplierQualStatus]}>{e.supplierQualStatus}</Badge>
                  )}
                </TD>
              </TR>
            )
          })}
        </TBody>
      </Table>
      {entries.length === 0 && <p className="mt-2 text-sm text-text-muted">No raw material entries yet.</p>}

      {correcting && (
        <CorrectionModal
          open={!!correcting}
          onClose={() => setCorrecting(null)}
          title={`Correct raw material entry #${correcting.lineNumber}`}
          action={correctRawMaterialEntry}
          hiddenFields={{ batchRecordId, correctsEntryId: correcting.id }}
        >
          <RawMaterialCorrectionFields entry={correcting} />
        </CorrectionModal>
      )}
    </div>
  )
}

// A fresh instance mounts each time `correcting` flips from null to an
// entry (see the parent's `{correcting && <CorrectionModal>...}` guard), so
// this local qualStatus state always initializes from the right entry.
function RawMaterialCorrectionFields({ entry }: { entry: EntryWithCorrections }) {
  const [qualStatus, setQualStatus] = useState<SupplierQualStatus>(entry.supplierQualStatus)

  return (
    <>
      <div className="flex flex-col gap-1">
        <Label htmlFor="tradeNameDescription">Trade Name / Description</Label>
        <Input id="tradeNameDescription" name="tradeNameDescription" defaultValue={entry.tradeNameDescription} required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="internalPartCode">Internal Part Code</Label>
        <Input id="internalPartCode" name="internalPartCode" defaultValue={entry.internalPartCode ?? ''} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="supplierName">Supplier Name</Label>
          <Input id="supplierName" name="supplierName" defaultValue={entry.supplierName} required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="supplierLotBatchNumber">Supplier Lot / Batch #</Label>
          <Input
            id="supplierLotBatchNumber"
            name="supplierLotBatchNumber"
            defaultValue={entry.supplierLotBatchNumber}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="qtyDispensed">Qty Dispensed</Label>
          <Input
            id="qtyDispensed"
            name="qtyDispensed"
            type="number"
            step="0.001"
            min="0"
            defaultValue={entry.qtyDispensed}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" name="unit" defaultValue={entry.unit} required />
        </div>
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm text-text">
        <input type="checkbox" name="coaReceived" defaultChecked={entry.coaReceived} className="h-4 w-4 shrink-0" />
        COA Received
      </label>

      <div className="flex flex-col gap-1">
        <Label htmlFor="supplierQualStatus">Supplier Qualification Status</Label>
        <Select
          id="supplierQualStatus"
          name="supplierQualStatus"
          value={qualStatus}
          onChange={(e) => setQualStatus(e.target.value as SupplierQualStatus)}
        >
          <option value="APPROVED">Approved</option>
          <option value="CONDITIONAL">Conditional</option>
          <option value="BLOCKED">Blocked</option>
        </Select>
      </div>

      {qualStatus === 'CONDITIONAL' && (
        <label className="flex items-start gap-2 rounded-md bg-warning/15 p-2 text-sm text-text">
          <input type="checkbox" name="conditionalAcknowledged" className="mt-0.5 h-4 w-4 shrink-0" required />
          I acknowledge this supplier is only Conditionally qualified and choose to proceed.
        </label>
      )}
      {qualStatus === 'BLOCKED' && (
        <p className="text-sm text-danger">
          This supplier is Blocked — saving will be rejected. Contact HoP/QC before dispensing this material.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="notes">Notes / Observations</Label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={entry.notes ?? ''} />
      </div>
    </>
  )
}
