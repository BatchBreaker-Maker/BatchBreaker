'use server'

import { redirect } from 'next/navigation'
import { redirectToBatch } from '@/lib/navigation/redirectToBatch'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import { COMPLETENESS_ITEM_ORDER } from '@/lib/workflow/completenessLabels'
import type { FormActionState } from '@/server/batches/actions'

export async function updateCompletenessReview(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  if (!batchRecordId) return { error: 'Missing batch record.' }
  requireSectionAccess(user.role, 16, 'signoff')

  await prisma.$transaction(
    COMPLETENESS_ITEM_ORDER.map((itemKey) => {
      const verified = formData.get(`${itemKey}__verified`) === 'on'
      const notApplicable = formData.get(`${itemKey}__na`) === 'on'
      return prisma.completenessReviewItem.upsert({
        where: { batchRecordId_itemKey: { batchRecordId, itemKey } },
        update: {
          verified,
          notApplicable,
          hopInitialsUserId: verified || notApplicable ? user.id : null,
        },
        create: {
          batchRecordId,
          itemKey,
          verified,
          notApplicable,
          hopInitialsUserId: verified || notApplicable ? user.id : null,
        },
      })
    }),
  )

  const items = await prisma.completenessReviewItem.findMany({ where: { batchRecordId } })
  const allAddressed =
    items.length === COMPLETENESS_ITEM_ORDER.length && items.every((i) => i.verified || i.notApplicable)
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId, sectionNumber: 16 },
    data: { status: allAddressed ? 'COMPLETE' : 'IN_PROGRESS' },
  })

  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'CompletenessReviewItem',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
  })

  redirectToBatch(`/batches/${batchRecordId}/sections/16`)
}

export async function signOffCompletenessReview(formData: FormData): Promise<void> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  requireSectionAccess(user.role, 16, 'signoff')

  const batch = await prisma.batchRecord.findUnique({ where: { id: batchRecordId } })
  if (!batch || batch.status !== 'PENDING_HOP_REVIEW') {
    throw new Error('This batch is not pending Head of Production review.')
  }

  const items = await prisma.completenessReviewItem.findMany({ where: { batchRecordId } })
  const allAddressed =
    items.length === COMPLETENESS_ITEM_ORDER.length && items.every((i) => i.verified || i.notApplicable)
  if (!allAddressed) {
    throw new Error('All completeness review items must be verified or marked N/A before sign-off.')
  }

  const now = new Date()
  await prisma.$transaction([
    prisma.completenessReviewItem.updateMany({
      where: { batchRecordId },
      data: { hopSignatureUserId: user.id, hopSignatureDate: now },
    }),
    prisma.sectionCompletionStatus.updateMany({
      where: { batchRecordId, sectionNumber: 16 },
      data: { status: 'APPROVED' },
    }),
    prisma.batchRecord.update({ where: { id: batchRecordId }, data: { status: 'PENDING_QC_REVIEW' } }),
  ])

  await recordAuditEntry({
    actionType: 'APPROVE',
    entityType: 'BatchRecord',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
    fieldName: 'status',
    oldValue: 'PENDING_HOP_REVIEW',
    newValue: 'PENDING_QC_REVIEW',
  })

  redirectToBatch(`/batches/${batchRecordId}/sections/16`)
}
