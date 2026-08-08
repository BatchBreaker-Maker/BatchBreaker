'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { redirectToBatch } from '@/lib/navigation/redirectToBatch'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import type { FormActionState } from '@/server/batches/actions'

const AddBatchNoteSchema = z.object({
  batchRecordId: z.string().uuid(),
  note: z.string().min(1),
})

export async function addBatchNote(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const parsed = AddBatchNoteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Note text is required.' }
  const data = parsed.data
  requireSectionAccess(user.role, 19, 'edit')

  const note = await prisma.batchNote.create({
    data: {
      batchRecordId: data.batchRecordId,
      authorUserId: user.id,
      note: data.note,
    },
  })

  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 19 },
    data: { status: 'IN_PROGRESS' },
  })

  await recordAuditEntry({
    actionType: 'CREATE',
    entityType: 'BatchNote',
    entityId: note.id,
    userId: user.id,
    batchRecordId: data.batchRecordId,
    newValue: data.note.slice(0, 200),
  })

  redirectToBatch(`/batches/${data.batchRecordId}/sections/19`)
}
