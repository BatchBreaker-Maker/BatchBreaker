'use server'

import { redirect } from 'next/navigation'
import { redirectToBatch } from '@/lib/navigation/redirectToBatch'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import { CHECKLIST_ITEM_ORDER } from '@/lib/workflow/checklistItems'
import type { FormActionState } from '@/server/batches/actions'

export async function updateChecklist(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  if (!batchRecordId) return { error: 'Missing batch record.' }
  requireSectionAccess(user.role, 3, 'edit')

  const now = new Date()
  await prisma.$transaction(
    CHECKLIST_ITEM_ORDER.map((itemKey) => {
      const verified = formData.get(itemKey) === 'on'
      return prisma.preProductionChecklistItem.upsert({
        where: { batchRecordId_itemKey: { batchRecordId, itemKey } },
        update: {
          verified,
          operatorInitialsUserId: verified ? user.id : null,
          verifiedAt: verified ? now : null,
        },
        create: {
          batchRecordId,
          itemKey,
          verified,
          operatorInitialsUserId: verified ? user.id : null,
          verifiedAt: verified ? now : null,
        },
      })
    }),
  )

  const unverifiedCount = await prisma.preProductionChecklistItem.count({
    where: { batchRecordId, verified: false },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId, sectionNumber: 3 },
    data: { status: unverifiedCount === 0 ? 'COMPLETE' : 'IN_PROGRESS' },
  })

  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'PreProductionChecklistItem',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
  })

  redirectToBatch(`/batches/${batchRecordId}/sections/3`)
}

export async function signOffChecklist(formData: FormData): Promise<void> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  if (!batchRecordId) redirectToBatch(`/batches/${batchRecordId}/sections/3`)
  requireSectionAccess(user.role, 3, 'signoff')

  const items = await prisma.preProductionChecklistItem.findMany({ where: { batchRecordId } })
  const allVerified = items.length === CHECKLIST_ITEM_ORDER.length && items.every((i) => i.verified)
  if (!allVerified) {
    throw new Error('All checklist items must be verified before sign-off.')
  }

  const now = new Date()
  await prisma.$transaction([
    prisma.preProductionChecklistItem.updateMany({
      where: { batchRecordId },
      data: { hopSignoffUserId: user.id, hopSignoffDate: now },
    }),
    prisma.sectionCompletionStatus.updateMany({
      where: { batchRecordId, sectionNumber: 3 },
      data: { status: 'APPROVED' },
    }),
  ])

  await recordAuditEntry({
    actionType: 'APPROVE',
    entityType: 'PreProductionChecklistItem',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
  })

  redirectToBatch(`/batches/${batchRecordId}/sections/3`)
}
