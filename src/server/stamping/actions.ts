'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { redirectToBatch } from '@/lib/navigation/redirectToBatch'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import type { FormActionState } from '@/server/batches/actions'

const SaveSetupSchema = z.object({
  batchRecordId: z.string().uuid(),
  dieStampId: z.string().min(1),
  dieConditionInspected: z.string().optional(),
  setupDate: z.string().optional(),
  totalBarsStamped: z.string().optional(),
  totalBarsRejected: z.string().optional(),
})

export async function saveStampingSetup(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = SaveSetupSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields.' }
  const data = parsed.data
  requireSectionAccess(user.role, 8, 'edit')

  await prisma.stampingSetup.upsert({
    where: { batchRecordId: data.batchRecordId },
    update: {
      dieStampId: data.dieStampId,
      dieConditionInspected: data.dieConditionInspected === 'on',
      setupVerifiedByUserId: user.id,
      setupDate: data.setupDate ? new Date(data.setupDate) : null,
      totalBarsStamped: data.totalBarsStamped ? Number(data.totalBarsStamped) : null,
      totalBarsRejected: data.totalBarsRejected ? Number(data.totalBarsRejected) : null,
    },
    create: {
      batchRecordId: data.batchRecordId,
      dieStampId: data.dieStampId,
      dieConditionInspected: data.dieConditionInspected === 'on',
      setupVerifiedByUserId: user.id,
      setupDate: data.setupDate ? new Date(data.setupDate) : null,
      totalBarsStamped: data.totalBarsStamped ? Number(data.totalBarsStamped) : null,
      totalBarsRejected: data.totalBarsRejected ? Number(data.totalBarsRejected) : null,
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 8 },
    data: { status: 'IN_PROGRESS', approvedByUserId: null, approvedAt: null },
  })
  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'StampingSetup',
    entityId: data.batchRecordId,
    userId: user.id,
    batchRecordId: data.batchRecordId,
  })
  redirectToBatch(`/batches/${data.batchRecordId}/sections/8`)
}

const AddPressRunSchema = z.object({
  batchRecordId: z.string().uuid(),
  dateTime: z.string().min(1),
  dieStampId: z.string().min(1),
  impressionQuality: z.string().optional(),
  barSurfaceCondition: z.string().optional(),
  appearanceOk: z.string().optional(),
})

export async function addPressRun(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = AddPressRunSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields.' }
  const data = parsed.data
  requireSectionAccess(user.role, 8, 'edit')

  const run = await prisma.pressRun.create({
    data: {
      batchRecordId: data.batchRecordId,
      dateTime: new Date(data.dateTime),
      dieStampId: data.dieStampId,
      impressionQuality: data.impressionQuality || null,
      barSurfaceCondition: data.barSurfaceCondition || null,
      appearanceOk: data.appearanceOk === 'on',
      operatorUserId: user.id,
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 8 },
    data: { status: 'IN_PROGRESS', approvedByUserId: null, approvedAt: null },
  })
  await recordAuditEntry({
    actionType: 'CREATE',
    entityType: 'PressRun',
    entityId: run.id,
    userId: user.id,
    batchRecordId: data.batchRecordId,
  })
  redirectToBatch(`/batches/${data.batchRecordId}/sections/8`)
}

const CorrectPressRunSchema = AddPressRunSchema.extend({
  correctsEntryId: z.string().uuid(),
  correctionReason: z.string().min(1),
})

export async function correctPressRun(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = CorrectPressRunSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields, including a reason for the correction.' }
  const data = parsed.data
  requireSectionAccess(user.role, 8, 'edit')

  const original = await prisma.pressRun.findUnique({ where: { id: data.correctsEntryId } })
  if (!original || original.batchRecordId !== data.batchRecordId) {
    return { error: 'Original entry not found.' }
  }
  const alreadySuperseded = await prisma.pressRun.findFirst({ where: { correctsEntryId: original.id } })
  if (alreadySuperseded) {
    return { error: 'This entry has already been corrected — correct the newest version instead.' }
  }

  const run = await prisma.pressRun.create({
    data: {
      batchRecordId: data.batchRecordId,
      dateTime: new Date(data.dateTime),
      dieStampId: data.dieStampId,
      impressionQuality: data.impressionQuality || null,
      barSurfaceCondition: data.barSurfaceCondition || null,
      appearanceOk: data.appearanceOk === 'on',
      operatorUserId: user.id,
      correctsEntryId: original.id,
      correctionReason: data.correctionReason,
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 8 },
    data: { status: 'IN_PROGRESS', approvedByUserId: null, approvedAt: null },
  })
  await recordAuditEntry({
    actionType: 'CORRECT',
    entityType: 'PressRun',
    entityId: run.id,
    userId: user.id,
    batchRecordId: data.batchRecordId,
    oldValue: original.id,
    correctionReason: data.correctionReason,
  })
  redirectToBatch(`/batches/${data.batchRecordId}/sections/8`)
}
