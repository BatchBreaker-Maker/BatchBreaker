'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import type { FormActionState } from '@/server/batches/actions'

const SaveCloseoutSchema = z.object({
  batchRecordId: z.string().uuid(),
  bulkStorageLocation: z.string().min(1),
  enteredInStoreLog: z.string().optional(),
  enteredInErp: z.enum(['YES', 'NO', 'NA']),
  unusedRmReturned: z.enum(['YES', 'NO', 'NA']),
  quantitiesRmReturned: z.string().optional(),
  stepsSubcontracted: z.string().optional(),
  subcontractorNameStep: z.string().optional(),
  subcontractorRecordAttached: z.string().optional(),
  batchCloseoutDate: z.string().min(1),
})

export async function savePostProductionCloseout(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const parsed = SaveCloseoutSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields.' }
  const data = parsed.data
  requireSectionAccess(user.role, 15, 'edit')

  const batch = await prisma.batchRecord.findUnique({ where: { id: data.batchRecordId } })
  if (!batch) return { error: 'Batch record not found.' }

  const stepsSubcontracted = data.stepsSubcontracted === 'on'
  const closeoutData = {
    bulkStorageLocation: data.bulkStorageLocation,
    enteredInStoreLog: data.enteredInStoreLog === 'on',
    enteredInErp: data.enteredInErp,
    unusedRmReturned: data.unusedRmReturned,
    quantitiesRmReturned: data.quantitiesRmReturned || null,
    stepsSubcontracted,
    subcontractorNameStep: stepsSubcontracted ? data.subcontractorNameStep || null : null,
    subcontractorRecordAttached: stepsSubcontracted ? data.subcontractorRecordAttached === 'on' : null,
    batchCloseoutDate: new Date(data.batchCloseoutDate),
    closeoutByUserId: user.id,
  }

  await prisma.$transaction([
    prisma.postProductionCloseout.upsert({
      where: { batchRecordId: data.batchRecordId },
      update: closeoutData,
      create: { batchRecordId: data.batchRecordId, ...closeoutData },
    }),
    prisma.sectionCompletionStatus.updateMany({
      where: { batchRecordId: data.batchRecordId, sectionNumber: 15 },
      data: { status: 'COMPLETE' },
    }),
    ...(batch.status === 'IN_PROGRESS'
      ? [prisma.batchRecord.update({ where: { id: data.batchRecordId }, data: { status: 'PENDING_HOP_REVIEW' as const } })]
      : []),
  ])

  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'PostProductionCloseout',
    entityId: data.batchRecordId,
    userId: user.id,
    batchRecordId: data.batchRecordId,
  })
  if (batch.status === 'IN_PROGRESS') {
    await recordAuditEntry({
      actionType: 'EDIT',
      entityType: 'BatchRecord',
      entityId: data.batchRecordId,
      userId: user.id,
      batchRecordId: data.batchRecordId,
      fieldName: 'status',
      oldValue: 'IN_PROGRESS',
      newValue: 'PENDING_HOP_REVIEW',
    })
  }

  redirect(`/batches/${data.batchRecordId}/sections/15`)
}
