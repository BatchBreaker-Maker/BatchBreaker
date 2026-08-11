'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { redirectToBatch } from '@/lib/navigation/redirectToBatch'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canDeleteAdditionalProcessingStep, requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import { PROCESSING_STEP_LABELS, PROCESSING_STEP_ORDER } from '@/lib/workflow/inProcessLabels'
import type { FormActionState } from '@/server/batches/actions'

// ===== 6.1 Processing Steps (7 fixed rows, upserted together) =====
export async function saveProcessingSteps(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  if (!batchRecordId) return { error: 'Missing batch record.' }
  requireSectionAccess(user.role, 6, 'edit')

  const writes = PROCESSING_STEP_ORDER.map((stepNumber) => {
    const timeValue = String(formData.get(`step${stepNumber}__timePerformed`) ?? '')
    const observationsNotes = String(formData.get(`step${stepNumber}__notes`) ?? '') || null
    // timePerformed is required — a step with no time yet simply has no row.
    // Skipping (rather than upserting a placeholder) lets steps be filled in
    // one at a time as they actually happen, like Equipment tolerates blank
    // rows, without needing a nullable timestamp column.
    if (!timeValue) return null
    return prisma.processingStep.upsert({
      where: { batchRecordId_stepNumber: { batchRecordId, stepNumber } },
      update: {
        stepDescription: PROCESSING_STEP_LABELS[stepNumber],
        timePerformed: new Date(timeValue),
        observationsNotes,
        performedByUserId: user.id,
      },
      create: {
        batchRecordId,
        stepNumber,
        stepDescription: PROCESSING_STEP_LABELS[stepNumber],
        timePerformed: new Date(timeValue),
        observationsNotes,
        performedByUserId: user.id,
      },
    })
  }).filter((w) => w !== null)

  if (writes.length > 0) {
    await prisma.$transaction(writes)
  }

  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId, sectionNumber: 6 },
    data: { status: 'IN_PROGRESS', approvedByUserId: null, approvedAt: null },
  })
  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'ProcessingStep',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
  })
  redirectToBatch(`/batches/${batchRecordId}/sections/6`)
}

// ===== 6.1 Additional Steps (open-ended, beyond the 7 fixed rows) =====
const AddAdditionalStepSchema = z.object({
  batchRecordId: z.string().uuid(),
  stepDescription: z.string().min(1),
  timePerformed: z.string().min(1),
  observationsNotes: z.string().optional(),
})

export async function addAdditionalProcessingStep(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = AddAdditionalStepSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields.' }
  const data = parsed.data
  requireSectionAccess(user.role, 6, 'edit')

  const step = await prisma.additionalProcessingStep.create({
    data: {
      batchRecordId: data.batchRecordId,
      stepDescription: data.stepDescription,
      timePerformed: new Date(data.timePerformed),
      performedByUserId: user.id,
      observationsNotes: data.observationsNotes || null,
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 6 },
    data: { status: 'IN_PROGRESS', approvedByUserId: null, approvedAt: null },
  })
  await recordAuditEntry({
    actionType: 'CREATE',
    entityType: 'AdditionalProcessingStep',
    entityId: step.id,
    userId: user.id,
    batchRecordId: data.batchRecordId,
    newValue: data.stepDescription,
  })
  redirectToBatch(`/batches/${data.batchRecordId}/sections/6`)
}

const CorrectAdditionalStepSchema = AddAdditionalStepSchema.extend({
  correctsEntryId: z.string().uuid(),
  correctionReason: z.string().min(1),
})

export async function correctAdditionalProcessingStep(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = CorrectAdditionalStepSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields, including a reason for the correction.' }
  const data = parsed.data
  requireSectionAccess(user.role, 6, 'edit')

  const original = await prisma.additionalProcessingStep.findUnique({ where: { id: data.correctsEntryId } })
  if (!original || original.batchRecordId !== data.batchRecordId) {
    return { error: 'Original entry not found.' }
  }
  const alreadySuperseded = await prisma.additionalProcessingStep.findFirst({
    where: { correctsEntryId: original.id },
  })
  if (alreadySuperseded) {
    return { error: 'This entry has already been corrected — correct the newest version instead.' }
  }

  const step = await prisma.additionalProcessingStep.create({
    data: {
      batchRecordId: data.batchRecordId,
      stepDescription: data.stepDescription,
      timePerformed: new Date(data.timePerformed),
      performedByUserId: user.id,
      observationsNotes: data.observationsNotes || null,
      correctsEntryId: original.id,
      correctionReason: data.correctionReason,
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 6 },
    data: { status: 'IN_PROGRESS', approvedByUserId: null, approvedAt: null },
  })
  await recordAuditEntry({
    actionType: 'CORRECT',
    entityType: 'AdditionalProcessingStep',
    entityId: step.id,
    userId: user.id,
    batchRecordId: data.batchRecordId,
    oldValue: original.id,
    newValue: data.stepDescription,
    correctionReason: data.correctionReason,
  })
  redirectToBatch(`/batches/${data.batchRecordId}/sections/6`)
}

// Deleting an additional step is a hard delete (unlike the correction flow
// above), restricted to a specific set of roles regardless of their normal
// section 6 access level — see canDeleteAdditionalProcessingStep. The
// deleted entry's data is captured in the audit trail before removal since
// the row itself won't exist to look up afterward.
export async function deleteAdditionalProcessingStep(formData: FormData): Promise<void> {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canDeleteAdditionalProcessingStep(user.role)) {
    throw new Error('Your role cannot delete additional step entries.')
  }

  const id = String(formData.get('id') ?? '')
  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  const entry = await prisma.additionalProcessingStep.findUnique({ where: { id } })
  if (!entry || entry.batchRecordId !== batchRecordId) {
    throw new Error('Entry not found.')
  }

  await prisma.additionalProcessingStep.delete({ where: { id } })
  await recordAuditEntry({
    actionType: 'DELETE',
    entityType: 'AdditionalProcessingStep',
    entityId: id,
    userId: user.id,
    batchRecordId,
    oldValue: `${entry.stepDescription} — ${entry.timePerformed.toISOString()}${entry.observationsNotes ? ` — ${entry.observationsNotes}` : ''}`,
  })
  redirectToBatch(`/batches/${batchRecordId}/sections/6`)
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
    data: { status: 'IN_PROGRESS', approvedByUserId: null, approvedAt: null },
  })
  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'HomogeneityCheck',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
  })
  redirectToBatch(`/batches/${batchRecordId}/sections/6`)
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
    data: { status: 'IN_PROGRESS', approvedByUserId: null, approvedAt: null },
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
  redirectToBatch(`/batches/${data.batchRecordId}/sections/6`)
}
