'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import type { FormActionState } from '@/server/batches/actions'

const AddSamplingEntrySchema = z.object({
  batchRecordId: z.string().uuid(),
  dateTime: z.string().min(1),
  samplingStage: z.string().min(1),
  testType: z.string().min(1),
  resultObservation: z.string().optional(),
  actionTaken: z.string().optional(),
  disposition: z.enum(['TESTED_RELEASED', 'RETAINED', 'DISCARDED']),
  dispositionReason: z.string().optional(),
})

export async function addSamplingEntry(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = AddSamplingEntrySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields.' }
  const data = parsed.data
  requireSectionAccess(user.role, 9, 'edit')

  if (data.disposition === 'DISCARDED' && !data.dispositionReason) {
    return { error: 'A reason is required when disposition is Discarded.' }
  }

  const entry = await prisma.samplingEntry.create({
    data: {
      batchRecordId: data.batchRecordId,
      dateTime: new Date(data.dateTime),
      samplingStage: data.samplingStage,
      testType: data.testType,
      resultObservation: data.resultObservation || null,
      actionTaken: data.actionTaken || null,
      disposition: data.disposition,
      dispositionReason: data.dispositionReason || null,
      samplerUserId: user.id,
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 9 },
    data: { status: 'IN_PROGRESS' },
  })
  await recordAuditEntry({
    actionType: 'CREATE',
    entityType: 'SamplingEntry',
    entityId: entry.id,
    userId: user.id,
    batchRecordId: data.batchRecordId,
  })
  redirect(`/batches/${data.batchRecordId}/sections/9`)
}
