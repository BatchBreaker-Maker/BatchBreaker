'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import type { FormActionState } from '@/server/batches/actions'

const SaveYieldSchema = z.object({
  batchRecordId: z.string().uuid(),
  expectedYield: z.coerce.number().positive(),
  expectedYieldUnit: z.string().min(1),
  actualYield: z.coerce.number().positive(),
  actualYieldUnit: z.string().min(1),
  varianceAcceptable: z.string().optional(),
  investigationInitiated: z.string().optional(),
  notesDisposition: z.string().optional(),
})

export async function saveYieldReconciliation(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = SaveYieldSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields.' }
  const data = parsed.data
  requireSectionAccess(user.role, 10, 'edit')

  const varianceAcceptable = data.varianceAcceptable === 'on'
  if (!varianceAcceptable && data.investigationInitiated !== 'on') {
    return { error: 'If variance is not acceptable, investigation must be marked as initiated.' }
  }

  await prisma.yieldReconciliation.upsert({
    where: { batchRecordId: data.batchRecordId },
    update: {
      expectedYield: data.expectedYield,
      expectedYieldUnit: data.expectedYieldUnit,
      actualYield: data.actualYield,
      actualYieldUnit: data.actualYieldUnit,
      varianceAcceptable,
      investigationInitiated: data.investigationInitiated === 'on',
      notesDisposition: data.notesDisposition || null,
    },
    create: {
      batchRecordId: data.batchRecordId,
      expectedYield: data.expectedYield,
      expectedYieldUnit: data.expectedYieldUnit,
      actualYield: data.actualYield,
      actualYieldUnit: data.actualYieldUnit,
      varianceAcceptable,
      investigationInitiated: data.investigationInitiated === 'on',
      notesDisposition: data.notesDisposition || null,
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 10 },
    data: { status: 'COMPLETE' },
  })
  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'YieldReconciliation',
    entityId: data.batchRecordId,
    userId: user.id,
    batchRecordId: data.batchRecordId,
  })
  redirect(`/batches/${data.batchRecordId}/sections/10`)
}
