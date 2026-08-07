'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import { EQUIPMENT_ROW_ORDER } from '@/lib/workflow/equipmentLabels'
import type { FormActionState } from '@/server/batches/actions'

export async function saveEquipmentVerification(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  if (!batchRecordId) return { error: 'Missing batch record.' }
  requireSectionAccess(user.role, 13, 'edit')

  const now = new Date()
  await prisma.$transaction(
    EQUIPMENT_ROW_ORDER.map((rowKey) => {
      const cleanedAndVerified = formData.get(`${rowKey}__cleaned`) === 'on'
      const calibrationCurrent = formData.get(`${rowKey}__calibration`) === 'on'
      const equipmentId = String(formData.get(`${rowKey}__equipmentId`) ?? '').trim() || null
      const touched = cleanedAndVerified || calibrationCurrent || equipmentId !== null
      return prisma.equipmentVerification.upsert({
        where: { batchRecordId_rowKey: { batchRecordId, rowKey } },
        update: {
          equipmentId,
          cleanedAndVerified,
          calibrationCurrent,
          verifiedByUserId: touched ? user.id : null,
          verifiedDate: touched ? now : null,
        },
        create: {
          batchRecordId,
          rowKey,
          equipmentId,
          cleanedAndVerified,
          calibrationCurrent,
          verifiedByUserId: touched ? user.id : null,
          verifiedDate: touched ? now : null,
        },
      })
    }),
  )

  const rows = await prisma.equipmentVerification.findMany({ where: { batchRecordId } })
  const allVerified = rows.length === EQUIPMENT_ROW_ORDER.length && rows.every((r) => r.cleanedAndVerified)
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId, sectionNumber: 13 },
    data: { status: allVerified ? 'COMPLETE' : 'IN_PROGRESS' },
  })

  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'EquipmentVerification',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
  })

  redirect(`/batches/${batchRecordId}/sections/13`)
}
