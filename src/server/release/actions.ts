'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { verifyPassword } from '@/lib/auth/password'
import { computeSignatureHash } from '@/lib/auth/signature'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import type { FormActionState } from '@/server/batches/actions'
import type { Role } from '@/generated/prisma/enums'

const DECISION_VALUES = ['RELEASED', 'REJECTED', 'QUARANTINED'] as const

export async function saveReleaseDecision(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  requireSectionAccess(user.role, 17, 'edit')

  const batch = await prisma.batchRecord.findUnique({ where: { id: batchRecordId } })
  if (!batch || batch.status !== 'PENDING_QC_REVIEW') {
    return { error: 'This batch is not pending QC review.' }
  }

  const openDeviations = await prisma.deviationEntry.findMany({
    where: { batchRecordId, status: 'OPEN' },
    orderBy: { sequenceNumber: 'asc' },
  })
  if (openDeviations.length > 0) {
    return {
      error: `Cannot record a release decision — open deviations must be resolved first: #${openDeviations.map((d) => d.sequenceNumber).join(', #')} (Section 14).`,
    }
  }

  const decision = String(formData.get('decision') ?? '')
  if (!DECISION_VALUES.includes(decision as (typeof DECISION_VALUES)[number])) {
    return { error: 'Select a release decision.' }
  }

  await prisma.$transaction([
    prisma.releaseDecision.upsert({
      where: { batchRecordId },
      update: {
        finishedProductSpecRef: String(formData.get('finishedProductSpecRef') ?? '') || null,
        inProcessResultsReviewed: formData.get('inProcessResultsReviewed') === 'on',
        oosResultsPending: formData.get('oosResultsPending') === 'on',
        decision: decision as (typeof DECISION_VALUES)[number],
        decisionBasisRationale: String(formData.get('decisionBasisRationale') ?? '') || null,
        reviewedById: user.id,
        reviewDate: new Date(),
      },
      create: {
        batchRecordId,
        finishedProductSpecRef: String(formData.get('finishedProductSpecRef') ?? '') || null,
        inProcessResultsReviewed: formData.get('inProcessResultsReviewed') === 'on',
        oosResultsPending: formData.get('oosResultsPending') === 'on',
        decision: decision as (typeof DECISION_VALUES)[number],
        decisionBasisRationale: String(formData.get('decisionBasisRationale') ?? '') || null,
        reviewedById: user.id,
        reviewDate: new Date(),
      },
    }),
    prisma.sectionCompletionStatus.updateMany({
      where: { batchRecordId, sectionNumber: 17 },
      data: { status: 'COMPLETE' },
    }),
  ])

  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'ReleaseDecision',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
    newValue: decision,
  })

  redirect(`/batches/${batchRecordId}/sections/17`)
}

const SIGNOFF_ROLES: Role[] = ['PRODUCTION_OPERATOR', 'HEAD_OF_PRODUCTION', 'QUALITY_UNIT']

export async function signFinalSignOff(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  const password = String(formData.get('password') ?? '')
  requireSectionAccess(user.role, 18, 'signoff')

  if (!SIGNOFF_ROLES.includes(user.role)) {
    return { error: 'Your role does not sign off Section 18.' }
  }

  const validPassword = await verifyPassword(password, user.passwordHash)
  if (!validPassword) {
    return { error: 'Incorrect password.' }
  }

  const [batch, releaseDecision, existingSignOff] = await Promise.all([
    prisma.batchRecord.findUnique({ where: { id: batchRecordId } }),
    prisma.releaseDecision.findUnique({ where: { batchRecordId } }),
    prisma.finalSignOff.findUnique({ where: { batchRecordId_role: { batchRecordId, role: user.role } } }),
  ])

  if (!batch || batch.status !== 'PENDING_QC_REVIEW') {
    return { error: 'This batch is not ready for final sign-off.' }
  }
  if (!releaseDecision?.decision) {
    return { error: 'QC must record a release decision (Section 17) before sign-off.' }
  }
  if (existingSignOff) {
    return { error: 'You have already signed this section.' }
  }

  const timestamp = new Date()
  const signatureHash = computeSignatureHash({ userId: user.id, batchRecordId, section: 18, timestamp })

  await prisma.finalSignOff.create({
    data: {
      batchRecordId,
      role: user.role,
      userId: user.id,
      signatureDate: timestamp,
      electronicSignatureHash: signatureHash,
    },
  })
  await recordAuditEntry({
    actionType: 'SIGN',
    entityType: 'FinalSignOff',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
    fieldName: 'role',
    newValue: user.role,
  })

  const allSignOffs = await prisma.finalSignOff.findMany({ where: { batchRecordId } })
  const allSigned = SIGNOFF_ROLES.every((role) => allSignOffs.some((s) => s.role === role))

  if (allSigned) {
    await prisma.$transaction([
      prisma.batchRecord.update({ where: { id: batchRecordId }, data: { status: releaseDecision.decision! } }),
      prisma.sectionCompletionStatus.updateMany({
        where: { batchRecordId, sectionNumber: { in: [17, 18] } },
        data: { status: 'APPROVED' },
      }),
    ])
    await recordAuditEntry({
      actionType: 'APPROVE',
      entityType: 'BatchRecord',
      entityId: batchRecordId,
      userId: user.id,
      batchRecordId,
      fieldName: 'status',
      newValue: releaseDecision.decision,
    })
  }

  redirect(`/batches/${batchRecordId}/sections/18`)
}
