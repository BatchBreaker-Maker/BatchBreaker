import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { EquipmentVerificationForm } from './EquipmentVerificationForm'
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
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const rows = await prisma.equipmentVerification.findMany({ where: { batchRecordId: batchId } })
  const existingByRow: Partial<Record<EquipmentRowKey, EquipmentVerificationModel>> = {}
  for (const row of rows) existingByRow[row.rowKey] = row
  const canEdit = canAccessSection(user.role, 13, 'edit')

  return (
    <div className="flex flex-col gap-8 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 13: Equipment &amp; Cleaning Verification</h1>

      <section className="flex flex-col gap-3">
        {canEdit ? (
          <EquipmentVerificationForm batchRecordId={batchId} existingByRow={existingByRow} />
        ) : (
          <p className="text-sm text-zinc-500">No edit access for this section.</p>
        )}
      </section>
    </div>
  )
}
