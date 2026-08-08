import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { ApproveSectionControl } from '@/components/workflow/ApproveSectionControl'
import { SamplingEntryForm } from './SamplingEntryForm'
import { SamplingEntryLogTable } from './SamplingEntryLogTable'

export default async function Section9Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 9, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const [entries, sectionStatus] = await Promise.all([
    prisma.samplingEntry.findMany({
      where: { batchRecordId: batchId },
      orderBy: { dateTime: 'asc' },
      include: { correctedByEntries: { select: { id: true } } },
    }),
    prisma.sectionCompletionStatus.findUnique({
      where: { batchRecordId_sectionNumber: { batchRecordId: batchId, sectionNumber: 9 } },
      include: { approvedByUser: { select: { fullName: true } } },
    }),
  ])
  const canEdit = canAccessSection(user.role, 9, 'edit')
  const canApprove = canAccessSection(user.role, 9, 'signoff')

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 9: In-Process Sampling Log</h1>
        {canApprove && (
          <ApproveSectionControl
            batchRecordId={batchId}
            sectionNumber={9}
            hasEntries={entries.length > 0}
            approvedByName={sectionStatus?.approvedByUser?.fullName ?? null}
            approvedAt={sectionStatus?.approvedAt ?? null}
          />
        )}
      </div>

      <SamplingEntryLogTable entries={entries} batchRecordId={batchId} canCorrect={canEdit} />

      {canEdit && <SamplingEntryForm batchRecordId={batchId} />}
    </div>
  )
}
