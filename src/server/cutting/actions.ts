'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { redirectToBatch } from '@/lib/navigation/redirectToBatch'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import type { FormActionState } from '@/server/batches/actions'

const AddCuttingObservationSchema = z.object({
  batchRecordId: z.string().uuid(),
  pourNumber: z.coerce.number().int().positive(),
  tempTopF: z.string().optional(),
  tempSideF: z.string().optional(),
  tempMiddleF: z.string().optional(),
  colorUniformity: z.string().optional(),
  visibleSeparation: z.string().optional(),
  foreignMatter: z.string().optional(),
  fragranceAdditionalComments: z.string().optional(),
})

export async function addCuttingObservation(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = AddCuttingObservationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields.' }
  const data = parsed.data
  requireSectionAccess(user.role, 7, 'edit')

  const obs = await prisma.cuttingObservation.create({
    data: {
      batchRecordId: data.batchRecordId,
      pourNumber: data.pourNumber,
      tempTopF: data.tempTopF ? Number(data.tempTopF) : null,
      tempSideF: data.tempSideF ? Number(data.tempSideF) : null,
      tempMiddleF: data.tempMiddleF ? Number(data.tempMiddleF) : null,
      colorUniformity: data.colorUniformity || null,
      visibleSeparation: data.visibleSeparation === 'on',
      foreignMatter: data.foreignMatter === 'on',
      fragranceAdditionalComments: data.fragranceAdditionalComments || null,
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 7 },
    data: { status: 'IN_PROGRESS', approvedByUserId: null, approvedAt: null },
  })
  await recordAuditEntry({
    actionType: 'CREATE',
    entityType: 'CuttingObservation',
    entityId: obs.id,
    userId: user.id,
    batchRecordId: data.batchRecordId,
    newValue: `Pour ${data.pourNumber}`,
  })
  redirectToBatch(`/batches/${data.batchRecordId}/sections/7`)
}

const CorrectCuttingObservationSchema = AddCuttingObservationSchema.extend({
  correctsEntryId: z.string().uuid(),
  correctionReason: z.string().min(1),
})

export async function correctCuttingObservation(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = CorrectCuttingObservationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields, including a reason for the correction.' }
  const data = parsed.data
  requireSectionAccess(user.role, 7, 'edit')

  const original = await prisma.cuttingObservation.findUnique({ where: { id: data.correctsEntryId } })
  if (!original || original.batchRecordId !== data.batchRecordId) {
    return { error: 'Original entry not found.' }
  }
  const alreadySuperseded = await prisma.cuttingObservation.findFirst({ where: { correctsEntryId: original.id } })
  if (alreadySuperseded) {
    return { error: 'This entry has already been corrected — correct the newest version instead.' }
  }

  const obs = await prisma.cuttingObservation.create({
    data: {
      batchRecordId: data.batchRecordId,
      pourNumber: original.pourNumber,
      tempTopF: data.tempTopF ? Number(data.tempTopF) : null,
      tempSideF: data.tempSideF ? Number(data.tempSideF) : null,
      tempMiddleF: data.tempMiddleF ? Number(data.tempMiddleF) : null,
      colorUniformity: data.colorUniformity || null,
      visibleSeparation: data.visibleSeparation === 'on',
      foreignMatter: data.foreignMatter === 'on',
      fragranceAdditionalComments: data.fragranceAdditionalComments || null,
      correctsEntryId: original.id,
      correctionReason: data.correctionReason,
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 7 },
    data: { status: 'IN_PROGRESS', approvedByUserId: null, approvedAt: null },
  })
  await recordAuditEntry({
    actionType: 'CORRECT',
    entityType: 'CuttingObservation',
    entityId: obs.id,
    userId: user.id,
    batchRecordId: data.batchRecordId,
    oldValue: original.id,
    newValue: `Pour ${original.pourNumber}`,
    correctionReason: data.correctionReason,
  })
  redirectToBatch(`/batches/${data.batchRecordId}/sections/7`)
}

export async function saveCuttingOverallComments(formData: FormData): Promise<void> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  requireSectionAccess(user.role, 7, 'edit')

  const comments = String(formData.get('cuttingOverallComments') ?? '')
  await prisma.batchRecord.update({
    where: { id: batchRecordId },
    data: { cuttingOverallComments: comments || null },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId, sectionNumber: 7 },
    data: { status: 'IN_PROGRESS', approvedByUserId: null, approvedAt: null },
  })
  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'BatchRecord',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
    fieldName: 'cuttingOverallComments',
  })
  redirectToBatch(`/batches/${batchRecordId}/sections/7`)
}
