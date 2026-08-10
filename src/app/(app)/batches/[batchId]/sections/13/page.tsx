import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { EquipmentVerificationForm } from './EquipmentVerificationForm'
import { AdditionalEquipmentForm } from './AdditionalEquipmentForm'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui'
import type { EquipmentVerificationModel } from '@/generated/prisma/models'
import type { EquipmentRowKey } from '@/generated/prisma/enums'

export default async function Section13Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 13, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const [rows, additionalEntries] = await Promise.all([
    prisma.equipmentVerification.findMany({ where: { batchRecordId: batchId } }),
    prisma.additionalEquipmentEntry.findMany({
      where: { batchRecordId: batchId },
      orderBy: { createdAt: 'asc' },
    }),
  ])
  const existingByRow: Partial<Record<EquipmentRowKey, EquipmentVerificationModel>> = {}
  for (const row of rows) existingByRow[row.rowKey] = row
  const canEdit = canAccessSection(user.role, 13, 'edit')

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 13: Equipment &amp; Cleaning Verification</h1>

      <p className="text-sm text-text-muted">
        If multiple pieces of equipment of the same type were used for this batch, enter each equipment ID
        separated by a comma, followed by any comments.
      </p>

      <section className="flex flex-col gap-3">
        {canEdit ? (
          <EquipmentVerificationForm batchRecordId={batchId} existingByRow={existingByRow} />
        ) : (
          <p className="text-sm text-text-muted">No edit access for this section.</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">Additional Equipment</h2>

        {additionalEntries.length > 0 ? (
          <div className="max-w-3xl">
            <Table>
              <THead>
                <TR>
                  <TH>Equipment Name</TH>
                  <TH>Equipment Number</TH>
                  <TH>Cleaned &amp; Verified</TH>
                  <TH>Calibration Current</TH>
                </TR>
              </THead>
              <TBody>
                {additionalEntries.map((e) => (
                  <TR key={e.id}>
                    <TD>{e.equipmentName}</TD>
                    <TD>{e.equipmentNumber || '—'}</TD>
                    <TD>{e.cleanedAndVerified ? 'Yes' : 'No'}</TD>
                    <TD>{e.calibrationCurrent ? 'Yes' : 'No'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No additional equipment logged.</p>
        )}

        {canEdit && <AdditionalEquipmentForm batchRecordId={batchId} />}
      </section>
    </div>
  )
}
