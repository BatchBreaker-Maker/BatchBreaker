'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { redirectToBatch } from '@/lib/navigation/redirectToBatch'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import { PRE_PACKAGING_ITEM_ORDER } from '@/lib/workflow/packagingLabels'
import type { FormActionState } from '@/server/batches/actions'

// ===== 11.1 Pre-Packaging Checklist =====
export async function savePrePackagingChecklist(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  if (!batchRecordId) return { error: 'Missing batch record.' }
  requireSectionAccess(user.role, 11, 'edit')

  const now = new Date()
  await prisma.$transaction(
    PRE_PACKAGING_ITEM_ORDER.map((itemKey) => {
      const verified = formData.get(itemKey) === 'on'
      return prisma.prePackagingChecklistItem.upsert({
        where: { batchRecordId_itemKey: { batchRecordId, itemKey } },
        update: { verified, verifiedById: verified ? user.id : null, verifiedAt: verified ? now : null },
        create: {
          batchRecordId,
          itemKey,
          verified,
          verifiedById: verified ? user.id : null,
          verifiedAt: verified ? now : null,
        },
      })
    }),
  )

  const unverifiedCount = await prisma.prePackagingChecklistItem.count({
    where: { batchRecordId, verified: false },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId, sectionNumber: 11 },
    data: { status: unverifiedCount === 0 ? 'COMPLETE' : 'IN_PROGRESS' },
  })

  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'PrePackagingChecklistItem',
    entityId: batchRecordId,
    userId: user.id,
    batchRecordId,
  })
  redirectToBatch(`/batches/${batchRecordId}/sections/11`)
}

// ===== 11.2 In-Process Packaging Checks =====
const AddPackagingCheckSchema = z.object({
  batchRecordId: z.string().uuid(),
  time: z.string().min(1),
  componentCorrect: z.string().optional(),
  labelCorrect: z.string().optional(),
  appearanceOk: z.string().optional(),
  fillWeightOk: z.string().optional(),
  notes: z.string().optional(),
})

export async function addPackagingCheck(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = AddPackagingCheckSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields.' }
  const data = parsed.data
  requireSectionAccess(user.role, 11, 'edit')

  const checkNumber = (await prisma.packagingCheck.count({ where: { batchRecordId: data.batchRecordId } })) + 1
  const check = await prisma.packagingCheck.create({
    data: {
      batchRecordId: data.batchRecordId,
      checkNumber,
      time: new Date(data.time),
      componentCorrect: data.componentCorrect === 'on',
      labelCorrect: data.labelCorrect === 'on',
      appearanceOk: data.appearanceOk === 'on',
      fillWeightOk: data.fillWeightOk === 'on',
      notes: data.notes || null,
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 11 },
    data: { status: 'IN_PROGRESS' },
  })
  await recordAuditEntry({
    actionType: 'CREATE',
    entityType: 'PackagingCheck',
    entityId: check.id,
    userId: user.id,
    batchRecordId: data.batchRecordId,
  })
  redirectToBatch(`/batches/${data.batchRecordId}/sections/11`)
}

// ===== 11.3 Unused Packaging Return =====
const SaveReturnSchema = z.object({
  batchRecordId: z.string().uuid(),
  returned: z.enum(['YES', 'NO', 'NA']),
  quantitiesReturned: z.string().optional(),
  returnedDate: z.string().optional(),
})

export async function savePackagingReturn(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  const parsed = SaveReturnSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please fill in all required fields.' }
  const data = parsed.data
  requireSectionAccess(user.role, 11, 'edit')

  await prisma.packagingReturn.upsert({
    where: { batchRecordId: data.batchRecordId },
    update: {
      returned: data.returned,
      quantitiesReturned: data.quantitiesReturned || null,
      returnedByUserId: user.id,
      returnedDate: data.returnedDate ? new Date(data.returnedDate) : null,
    },
    create: {
      batchRecordId: data.batchRecordId,
      returned: data.returned,
      quantitiesReturned: data.quantitiesReturned || null,
      returnedByUserId: user.id,
      returnedDate: data.returnedDate ? new Date(data.returnedDate) : null,
    },
  })
  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 11 },
    data: { status: 'IN_PROGRESS' },
  })
  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'PackagingReturn',
    entityId: data.batchRecordId,
    userId: user.id,
    batchRecordId: data.batchRecordId,
  })
  redirectToBatch(`/batches/${data.batchRecordId}/sections/11`)
}
