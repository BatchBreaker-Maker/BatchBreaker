'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { redirectToBatch } from '@/lib/navigation/redirectToBatch'
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

  redirectToBatch(`/batches/${batch.id}`)
}

const AssignPersonnelSchema = z.object({
  batchRecordId: z.string().uuid(),
  productionOperatorNames: z.string().min(1),
  headOfProductionName: z.string().min(1),
  qcReviewerName: z.string().min(1),
})

export async function assignBatchPersonnel(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const parsed = AssignPersonnelSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: 'Please fill in the production operator(s), Head of Production, and QC Reviewer.' }
  }
  const data = parsed.data
  requireSectionAccess(user.role, 2, 'edit')

  const productionOperatorNames = data.productionOperatorNames
    .split('\n')
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
  if (productionOperatorNames.length === 0) {
    return { error: 'At least one Production Operator name is required.' }
  }
  const headOfProductionName = data.headOfProductionName.trim()
  const qcReviewerName = data.qcReviewerName.trim()

  const qcConflictsWithOperator = productionOperatorNames.some(
    (name) => name.toLowerCase() === qcReviewerName.toLowerCase(),
  )
  const qcConflictsWithHop = headOfProductionName.toLowerCase() === qcReviewerName.toLowerCase()
  if (qcConflictsWithOperator || qcConflictsWithHop) {
    return { error: 'QC Reviewer cannot be the same person listed as a Production Operator or Head of Production.' }
  }

  await prisma.$transaction([
    prisma.batchRecord.update({
      where: { id: data.batchRecordId },
      data: {
        productionOperatorNames,
        headOfProductionName,
        qcReviewerName,
        status: 'IN_PROGRESS',
      },
    }),
    prisma.sectionCompletionStatus.updateMany({
      where: { batchRecordId: data.batchRecordId, sectionNumber: 2 },
      data: { status: 'COMPLETE' },
    }),
  ])

  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'BatchRecord',
    entityId: data.batchRecordId,
    userId: user.id,
    batchRecordId: data.batchRecordId,
    fieldName: 'personnel',
  })

  redirectToBatch(`/batches/${data.batchRecordId}`)
}
