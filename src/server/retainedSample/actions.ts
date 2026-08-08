'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { redirectToBatch } from '@/lib/navigation/redirectToBatch'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import type { FormActionState } from '@/server/batches/actions'

const SaveRetainedSampleSchema = z.object({
  batchRecordId: z.string().uuid(),
  unitsCollected: z.coerce.number().int().min(2),
  sampleLabelApplied: z.string().optional(),
  storageLocation: z.string().min(1),
  dateCollected: z.string().min(1),
  notes: z.string().optional(),
  minimumRetentionPeriod: z.string().optional(),
  scheduledDestructionReviewDate: z.string().min(1),
})

export async function saveRetainedSampleRecord(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = SaveRetainedSampleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields (minimum 2 units).' }
  const data = parsed.data
  requireSectionAccess(user.role, 12, 'edit')

  await prisma.retainedSampleRecord.upsert({
    where: { batchRecordId: data.batchRecordId },
    update: {
      unitsCollected: data.unitsCollected,
      sampleLabelApplied: data.sampleLabelApplied === 'on',
      storageLocation: data.storageLocation,
      dateCollected: new Date(data.dateCollected),
      collectedByUserId: user.id,
      notes: data.notes || null,
      minimumRetentionPeriod: data.minimumRetentionPeriod || null,
      scheduledDestructionReviewDate: new Date(data.scheduledDestructionReviewDate),
    },
    create: {
      batchRecordId: data.batchRecordId,
      unitsCollected: data.unitsCollected,
      sampleLabelApplied: data.sampleLabelApplied === 'on',
      storageLocation: data.storageLocation,
      dateCollected: new Date(data.dateCollected),
      collectedByUserId: user.id,
      notes: data.notes || null,
      minimumRetentionPeriod: data.minimumRetentionPeriod || null,
      scheduledDestructionReviewDate: new Date(data.scheduledDestructionReviewDate),
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 12 },
    data: { status: 'COMPLETE' },
  })
  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'RetainedSampleRecord',
    entityId: data.batchRecordId,
    userId: user.id,
    batchRecordId: data.batchRecordId,
  })
  redirectToBatch(`/batches/${data.batchRecordId}/sections/12`)
}

export async function authorizeSampleDestruction(formData: FormData): Promise<void> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  requireSectionAccess(user.role, 12, 'edit')

  await prisma.retainedSampleRecord.update({
    where: { batchRecordId },
    data: { destructionAuthorizedByUserId: user.id, destructionDate: new Date() },
  })
  await recordAuditEntry({
    actionType: 'APPROVE',
    entityType: 'RetainedSampleRecord',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
    fieldName: 'destructionDate',
  })
  redirectToBatch(`/batches/${batchRecordId}/sections/12`)
}
