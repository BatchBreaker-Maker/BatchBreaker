'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import type { FormActionState } from '@/server/batches/actions'

const AddTemperatureSchema = z.object({
  batchRecordId: z.string().uuid(),
  materialIngredient: z.string().min(1),
  acceptableTempMinF: z.coerce.number(),
  acceptableTempMaxF: z.coerce.number(),
  actualTempF: z.coerce.number(),
  timeOfAddition: z.string().min(1),
})

export async function addTemperatureEntry(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const parsed = AddTemperatureSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: 'Please fill in all required fields.' }
  }
  const data = parsed.data
  requireSectionAccess(user.role, 5, 'edit')

  if (data.acceptableTempMaxF < data.acceptableTempMinF) {
    return { error: 'Acceptable max temperature must be greater than or equal to the min.' }
  }

  const withinRange = data.actualTempF >= data.acceptableTempMinF && data.actualTempF <= data.acceptableTempMaxF
  const lineNumber = (await prisma.temperatureEntry.count({ where: { batchRecordId: data.batchRecordId } })) + 1

  const entry = await prisma.temperatureEntry.create({
    data: {
      batchRecordId: data.batchRecordId,
      lineNumber,
      materialIngredient: data.materialIngredient,
      acceptableTempMinF: data.acceptableTempMinF,
      acceptableTempMaxF: data.acceptableTempMaxF,
      actualTempF: data.actualTempF,
      withinRange,
      timeOfAddition: new Date(data.timeOfAddition),
      operatorUserId: user.id,
    },
  })

  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId: data.batchRecordId, sectionNumber: 5 },
    data: { status: 'IN_PROGRESS' },
  })

  await recordAuditEntry({
    actionType: 'CREATE',
    entityType: 'TemperatureEntry',
    entityId: entry.id,
    userId: user.id,
    batchRecordId: data.batchRecordId,
    newValue: `${data.materialIngredient}: ${data.actualTempF}°F (${withinRange ? 'within range' : 'OUT OF RANGE'})`,
  })

  redirect(`/batches/${data.batchRecordId}/sections/5`)
}
