'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import { calculateRetentionDeadline } from '@/lib/batches/retention'
import { IMPLEMENTED_SECTIONS } from '@/lib/workflow/sections'

const CreateBatchSchema = z
  .object({
    batchNumber: z.string().min(1),
    confirmBatchNumber: z.string().min(1),
    productName: z.string().min(1),
    productCodeSku: z.string().optional(),
    productType: z.enum(['BAR_SOAP', 'LIQUID_HAND_SOAP', 'OTHER']),
    finishedProductSpecRef: z.string().optional(),
    formulaNumber: z.string().min(1),
    formulaVersion: z.string().min(1),
    batchSizeTarget: z.coerce.number().positive(),
    batchSizeUnit: z.string().min(1),
    productionDate: z.string().min(1),
    plannedCompletionDate: z.string().optional(),
    manufacturingSiteRoom: z.string().optional(),
    complaintRecallRef: z.string().optional(),
    adverseEventRef: z.string().optional(),
  })
  .refine((data) => data.batchNumber === data.confirmBatchNumber, {
    message: 'Batch number entries do not match.',
    path: ['confirmBatchNumber'],
  })

export type FormActionState = { error?: string } | undefined

export async function createBatchRecord(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  requireSectionAccess(user.role, 1, 'edit')

  const parsed = CreateBatchSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    // Batch number mismatch is the one validation error worth naming specifically —
    // the double-entry check exists precisely to catch typos before they're locked in.
    const mismatch = parsed.error.issues.find((i) => i.path[0] === 'confirmBatchNumber')
    return { error: mismatch ? mismatch.message : 'Please fill in all required fields.' }
  }
  const data = parsed.data

  const existing = await prisma.batchRecord.findUnique({ where: { batchNumber: data.batchNumber } })
  if (existing) {
    return { error: `Batch number "${data.batchNumber}" is already in use.` }
  }

  const productionDate = new Date(data.productionDate)
  const retentionDeadline = calculateRetentionDeadline(productionDate)

  const batch = await prisma.batchRecord.create({
    data: {
      batchNumber: data.batchNumber,
      productName: data.productName,
      productCodeSku: data.productCodeSku || null,
      productType: data.productType,
      finishedProductSpecRef: data.finishedProductSpecRef || null,
      formulaNumber: data.formulaNumber,
      formulaVersion: data.formulaVersion,
      batchSizeTarget: data.batchSizeTarget,
      batchSizeUnit: data.batchSizeUnit,
      productionDate,
      plannedCompletionDate: data.plannedCompletionDate ? new Date(data.plannedCompletionDate) : null,
      manufacturingSiteRoom: data.manufacturingSiteRoom || null,
      complaintRecallRef: data.complaintRecallRef || null,
      adverseEventRef: data.adverseEventRef || null,
      retentionDeadline,
      status: 'DRAFT',
      createdById: user.id,
      sectionStatuses: {
        create: IMPLEMENTED_SECTIONS.map((sectionNumber) => ({
          sectionNumber,
          status: sectionNumber === 1 ? ('COMPLETE' as const) : ('NOT_STARTED' as const),
        })),
      },
    },
  })

  await recordAuditEntry({
    actionType: 'CREATE',
    entityType: 'BatchRecord',
    entityId: batch.id,
    userId: user.id,
    batchRecordId: batch.id,
    newValue: data.batchNumber,
  })

  redirect(`/batches/${batch.id}`)
}

const AssignPersonnelSchema = z.object({
  batchRecordId: z.string().uuid(),
  operatorUserId: z.string().uuid(),
  headOfProductionUserId: z.string().uuid(),
  qcReviewerUserId: z.string().uuid(),
})

export async function assignBatchPersonnel(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const parsed = AssignPersonnelSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: 'Please select a user for every role.' }
  }
  const data = parsed.data
  requireSectionAccess(user.role, 2, 'edit')

  const assignments = [
    { userId: data.operatorUserId, roleInBatch: 'OPERATOR' as const },
    { userId: data.headOfProductionUserId, roleInBatch: 'HEAD_OF_PRODUCTION' as const },
    { userId: data.qcReviewerUserId, roleInBatch: 'QC_REVIEWER' as const },
  ]

  const expectedRole: Record<(typeof assignments)[number]['roleInBatch'], string> = {
    OPERATOR: 'PRODUCTION_OPERATOR',
    HEAD_OF_PRODUCTION: 'HEAD_OF_PRODUCTION',
    QC_REVIEWER: 'QUALITY_UNIT',
  }
  const users = await prisma.user.findMany({
    where: { id: { in: assignments.map((a) => a.userId) } },
  })
  for (const a of assignments) {
    const u = users.find((candidate) => candidate.id === a.userId)
    if (!u || u.role !== expectedRole[a.roleInBatch]) {
      return { error: 'One of the selected users does not hold the required role.' }
    }
  }

  await prisma.$transaction([
    prisma.batchPersonnel.deleteMany({ where: { batchRecordId: data.batchRecordId } }),
    prisma.batchPersonnel.createMany({
      data: assignments.map((a) => ({ ...a, batchRecordId: data.batchRecordId })),
    }),
    prisma.sectionCompletionStatus.updateMany({
      where: { batchRecordId: data.batchRecordId, sectionNumber: 2 },
      data: { status: 'COMPLETE' },
    }),
    prisma.batchRecord.update({
      where: { id: data.batchRecordId },
      data: { status: 'IN_PROGRESS' },
    }),
  ])

  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'BatchPersonnel',
    entityId: data.batchRecordId,
    userId: user.id,
    batchRecordId: data.batchRecordId,
  })

  redirect(`/batches/${data.batchRecordId}`)
}
