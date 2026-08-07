'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import type { FormActionState } from '@/server/batches/actions'

// ===== 6.1 Processing Steps =====
const AddStepSchema = z.object({
  batchRecordId: z.string().uuid(),
  stepNumber: z.coerce.number().int().min(1).max(8),
  stepDescription: z.string().min(1),
  timePerformed: z.string().min(1),
  observationsNotes: z.string().optional(),
})

export async function addProcessingStep(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = AddStepSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields.' }
  const data = parsed.data
  requireSectionAccess(user.role, 6, 'edit')

  const step = await prisma.processingStep.create({
    data: {
      batchRecordId: data.batchRecordId,
      stepNumber: data.stepNumber,
      stepDescription: data.stepDescription,
      timePerformed: new Date(data.timePerformed),
      performedByUserId: user.id,
      observationsNotes: data.observationsNotes || null,
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 6 },
    data: { status: 'IN_PROGRESS' },
  })
  await recordAuditEntry({
    actionType: 'CREATE',
    entityType: 'ProcessingStep',
    entityId: step.id,
    userId: user.id,
    batchRecordId: data.batchRecordId,
    newValue: `Step ${data.stepNumber}: ${data.stepDescription}`,
  })
  redirect(`/batches/${data.batchRecordId}/sections/6`)
}

// ===== 6.2 Visual Homogeneity Checks (5 fixed items, saved together) =====
const HOMOGENEITY_ITEMS = [
  'HOMOGENEITY',
  'ABSENCE_OF_FOREIGN_MATTER',
  'FRAGRANCE_INCORPORATION',
  'COLORANT_INCORPORATION',
  'NO_SEPARATION_OR_RICING',
] as const

export async function saveHomogeneityChecks(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  if (!batchRecordId) return { error: 'Missing batch record.' }
  requireSectionAccess(user.role, 6, 'edit')

  const now = new Date()
  await prisma.$transaction(
    HOMOGENEITY_ITEMS.map((checkItem) => {
      const result = formData.get(`result_${checkItem}`)
      const comments = String(formData.get(`comments_${checkItem}`) ?? '') || null
      return prisma.homogeneityCheck.upsert({
        where: { batchRecordId_checkItem: { batchRecordId, checkItem } },
        update: { result: result ? (result as 'PASS' | 'FAIL') : null, comments, timeObserved: now },
        create: {
          batchRecordId,
          checkItem,
          result: result ? (result as 'PASS' | 'FAIL') : null,
          comments,
          timeObserved: now,
        },
      })
    }),
  )
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId, sectionNumber: 6 },
    data: { status: 'IN_PROGRESS' },
  })
  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'HomogeneityCheck',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
  })
  redirect(`/batches/${batchRecordId}/sections/6`)
}

// ===== 6.3 / 6.4 Cure Records =====
const CureRecordSchema = z.object({
  batchRecordId: z.string().uuid(),
  phase: z.enum(['PRE_CUT', 'POST_CUT']),
  dateTimeStart: z.string().optional(),
  targetCureDuration: z.string().optional(),
  dateTimeRemoved: z.string().optional(),
  curingLocationConditions: z.string().optional(),
  curePeriodAcceptable: z.string().optional(),
  phMeasurementDateTime: z.string().optional(),
  phResult: z.string().optional(),
  freeCausticCheckMethod: z.string().optional(),
  freeCausticCheckResult: z.string().optional(),
})

export async function saveCureRecord(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = CureRecordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please check the form and try again.' }
  const data = parsed.data
  requireSectionAccess(user.role, 6, 'edit')

  await prisma.cureRecord.upsert({
    where: { batchRecordId_phase: { batchRecordId: data.batchRecordId, phase: data.phase } },
    update: {
      dateTimeStart: data.dateTimeStart ? new Date(data.dateTimeStart) : null,
      targetCureDuration: data.targetCureDuration || null,
      dateTimeRemoved: data.dateTimeRemoved ? new Date(data.dateTimeRemoved) : null,
      curingLocationConditions: data.curingLocationConditions || null,
      curePeriodAcceptable: data.curePeriodAcceptable === 'on',
      phMeasurementDateTime: data.phMeasurementDateTime ? new Date(data.phMeasurementDateTime) : null,
      phResult: data.phResult ? Number(data.phResult) : null,
      freeCausticCheckMethod: data.freeCausticCheckMethod || null,
      freeCausticCheckResult: data.freeCausticCheckResult || null,
    },
    create: {
      batchRecordId: data.batchRecordId,
      phase: data.phase,
      dateTimeStart: data.dateTimeStart ? new Date(data.dateTimeStart) : null,
      targetCureDuration: data.targetCureDuration || null,
      dateTimeRemoved: data.dateTimeRemoved ? new Date(data.dateTimeRemoved) : null,
      curingLocationConditions: data.curingLocationConditions || null,
      curePeriodAcceptable: data.curePeriodAcceptable === 'on',
      phMeasurementDateTime: data.phMeasurementDateTime ? new Date(data.phMeasurementDateTime) : null,
      phResult: data.phResult ? Number(data.phResult) : null,
      freeCausticCheckMethod: data.freeCausticCheckMethod || null,
      freeCausticCheckResult: data.freeCausticCheckResult || null,
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 6 },
    data: { status: 'IN_PROGRESS' },
  })
  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'CureRecord',
    entityId: `${data.batchRecordId}:${data.phase}`,
    userId: user.id,
    batchRecordId: data.batchRecordId,
    fieldName: 'phase',
    newValue: data.phase,
  })
  redirect(`/batches/${data.batchRecordId}/sections/6`)
}
