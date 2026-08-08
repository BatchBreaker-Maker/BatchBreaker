'use server'

import { redirect } from 'next/navigation'
import { redirectToBatch } from '@/lib/navigation/redirectToBatch'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { requireSectionAccess } from '@/lib/auth/permissionMatrix'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'

// Sections 4-9 are open-ended logs with no field-driven "complete" state —
// HoP (or QC, where applicable) signs off explicitly once the log is
// accurate. Approval is cleared automatically whenever new data is added
// (see each section's add*/correct* actions), so it always reflects review
// of what's currently there, not a stale snapshot.
const OPEN_ENDED_LOG_SECTIONS = [4, 5, 6, 7, 8, 9] as const
type OpenEndedLogSection = (typeof OPEN_ENDED_LOG_SECTIONS)[number]

const ENTRY_COUNTERS: Record<OpenEndedLogSection, (batchRecordId: string) => Promise<number>> = {
  4: (batchRecordId) => prisma.rawMaterialEntry.count({ where: { batchRecordId } }),
  5: (batchRecordId) => prisma.temperatureEntry.count({ where: { batchRecordId } }),
  6: (batchRecordId) => prisma.processingStep.count({ where: { batchRecordId } }),
  7: (batchRecordId) => prisma.cuttingObservation.count({ where: { batchRecordId } }),
  8: (batchRecordId) => prisma.pressRun.count({ where: { batchRecordId } }),
  9: (batchRecordId) => prisma.samplingEntry.count({ where: { batchRecordId } }),
}

export async function approveOpenEndedSection(formData: FormData): Promise<void> {
  const user = await verifySession()
  if (!user) redirect('/login')

  const batchRecordId = String(formData.get('batchRecordId') ?? '')
  const sectionNumber = Number(formData.get('sectionNumber'))
  if (!batchRecordId || !OPEN_ENDED_LOG_SECTIONS.includes(sectionNumber as OpenEndedLogSection)) {
    throw new Error('Invalid section for approval.')
  }
  const section = sectionNumber as OpenEndedLogSection
  requireSectionAccess(user.role, section, 'signoff')

  // UI already disables the Approve control until there's data — this is the
  // real gate, since the client-side disabled state can be bypassed.
  const entryCount = await ENTRY_COUNTERS[section](batchRecordId)
  if (entryCount === 0) {
    throw new Error('Cannot approve a section with no entries yet.')
  }

  await prisma.sectionCompletionStatus.updateMany({
    where: { batchRecordId, sectionNumber: section },
    data: { status: 'APPROVED', approvedByUserId: user.id, approvedAt: new Date() },
  })

  await recordAuditEntry({
    actionType: 'APPROVE',
    entityType: 'SectionCompletionStatus',
    entityId: `${batchRecordId}:${section}`,
    userId: user.id,
    batchRecordId,
    fieldName: 'status',
    newValue: 'APPROVED',
  })

  redirectToBatch(`/batches/${batchRecordId}/sections/${section}`)
}
