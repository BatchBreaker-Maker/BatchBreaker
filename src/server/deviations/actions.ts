'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { redirectToBatch } from '@/lib/navigation/redirectToBatch'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import type { FormActionState } from '@/server/batches/actions'

const AddDeviationSchema = z.object({
  batchRecordId: z.string().uuid(),
  dateTime: z.string().min(1),
  type: z.enum(['INCIDENT', 'DEVIATION', 'CRITICAL_DEVIATION']),
  description: z.string().min(1),
  correctiveActionTaken: z.string().optional(),
  reportedToUserId: z.string().optional(),
})

export async function addDeviationEntry(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const parsed = AddDeviationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields.' }
  const data = parsed.data
  requireSectionAccess(user.role, 14, 'edit')

  const sequenceNumber = (await prisma.deviationEntry.count({ where: { batchRecordId: data.batchRecordId } })) + 1

  const entry = await prisma.deviationEntry.create({
    data: {
      batchRecordId: data.batchRecordId,
      sequenceNumber,
      dateTime: new Date(data.dateTime),
      type: data.type,
      description: data.description,
      correctiveActionTaken: data.correctiveActionTaken || null,
      reportedToUserId: data.reportedToUserId || null,
    },
  })

  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 14 },
    data: { status: 'IN_PROGRESS' },
  })

  await recordAuditEntry({
    actionType: 'CREATE',
    entityType: 'DeviationEntry',
    entityId: entry.id,
    userId: user.id,
    batchRecordId: data.batchRecordId,
    newValue: `${data.type}: ${data.description.slice(0, 200)}`,
  })

  redirectToBatch(`/batches/${data.batchRecordId}/sections/14`)
}

const ResolveDeviationSchema = z.object({
  deviationId: z.string().uuid(),
  batchRecordId: z.string().uuid(),
  resolutionRationale: z.string().min(1),
})

export async function resolveDeviation(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const parsed = ResolveDeviationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'A documented rationale is required to resolve a deviation.' }
  const data = parsed.data
  requireSectionAccess(user.role, 14, 'signoff')

  await prisma.deviationEntry.update({
    where: { id: data.deviationId },
    data: {
      status: 'RESOLVED',
      resolvedByUserId: user.id,
      resolvedDate: new Date(),
      resolutionRationale: data.resolutionRationale,
    },
  })

  const openCount = await prisma.deviationEntry.count({
    where: { batchRecordId: data.batchRecordId, status: 'OPEN' },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 14 },
    data: { status: openCount === 0 ? 'COMPLETE' : 'IN_PROGRESS' },
  })

  await recordAuditEntry({
    actionType: 'APPROVE',
    entityType: 'DeviationEntry',
    entityId: data.deviationId,
    userId: user.id,
    batchRecordId: data.batchRecordId,
    fieldName: 'status',
    newValue: 'RESOLVED',
  })

  redirectToBatch(`/batches/${data.batchRecordId}/sections/14`)
}

export async function confirmNoDeviations(formData: FormData): Promise<void> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  requireSectionAccess(user.role, 14, 'edit')

  const existingCount = await prisma.deviationEntry.count({ where: { batchRecordId } })
  if (existingCount > 0) {
    throw new Error('Cannot confirm no deviations: deviations have already been logged for this batch.')
  }

  await prisma.batchRecord.update({
    where: { id: batchRecordId },
    data: { noDeviationsConfirmedByUserId: user.id, noDeviationsConfirmedDate: new Date() },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId, sectionNumber: 14 },
    data: { status: 'COMPLETE' },
  })

  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'BatchRecord',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
    fieldName: 'noDeviationsConfirmedDate',
  })

  redirectToBatch(`/batches/${batchRecordId}/sections/14`)
}
