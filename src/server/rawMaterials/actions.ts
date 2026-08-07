'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import type { FormActionState } from '@/server/batches/actions'

const AddRawMaterialSchema = z.object({
  batchRecordId: z.string().uuid(),
  tradeNameDescription: z.string().min(1),
  internalPartCode: z.string().optional(),
  supplierName: z.string().min(1),
  supplierLotBatchNumber: z.string().min(1),
  qtyDispensed: z.coerce.number().positive(),
  unit: z.string().min(1),
  coaReceived: z.string().optional(),
  supplierQualStatus: z.enum(['APPROVED', 'CONDITIONAL', 'BLOCKED']),
  conditionalAcknowledged: z.string().optional(),
  notes: z.string().optional(),
})

export async function addRawMaterialEntry(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const parsed = AddRawMaterialSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: 'Please fill in all required fields.' }
  }
  const data = parsed.data
  requireSectionAccess(user.role, 4, 'edit')

  // The three-way qualification gate: Blocked never saves; Conditional needs
  // the explicit acknowledgment the user asked for; Approved is frictionless.
  if (data.supplierQualStatus === 'BLOCKED') {
    return { error: 'This supplier is Blocked and cannot be used. Resolve with QC/HoP before dispensing this material.' }
  }
  if (data.supplierQualStatus === 'CONDITIONAL' && data.conditionalAcknowledged !== 'on') {
    return { error: 'This supplier is Conditional — check the acknowledgment box to proceed anyway.' }
  }

  const lineNumber = (await prisma.rawMaterialEntry.count({ where: { batchRecordId: data.batchRecordId } })) + 1

  const entry = await prisma.rawMaterialEntry.create({
    data: {
      batchRecordId: data.batchRecordId,
      lineNumber,
      tradeNameDescription: data.tradeNameDescription,
      internalPartCode: data.internalPartCode || null,
      supplierName: data.supplierName,
      supplierLotBatchNumber: data.supplierLotBatchNumber,
      qtyDispensed: data.qtyDispensed,
      unit: data.unit,
      coaReceived: data.coaReceived === 'on',
      supplierQualStatus: data.supplierQualStatus,
      notes: data.notes || null,
    },
  })

  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 4 },
    data: { status: 'IN_PROGRESS' },
  })

  await recordAuditEntry({
    actionType: 'CREATE',
    entityType: 'RawMaterialEntry',
    entityId: entry.id,
    userId: user.id,
    batchRecordId: data.batchRecordId,
    newValue: `${data.tradeNameDescription} (lot ${data.supplierLotBatchNumber})`,
  })

  redirect(`/batches/${data.batchRecordId}/sections/4`)
}
