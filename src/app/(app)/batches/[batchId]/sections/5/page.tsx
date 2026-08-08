import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { ApproveSectionControl } from '@/components/workflow/ApproveSectionControl'
import { TemperatureForm } from './TemperatureForm'
import { TemperatureLogTable } from './TemperatureLogTable'

export default async function Section5Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 5, 'view')) {
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
    prisma.temperatureEntry.findMany({
      where: { batchRecordId: batchId },
      orderBy: { lineNumber: 'asc' },
      include: { correctedByEntries: { select: { id: true } } },
    }),
    prisma.sectionCompletionStatus.findUnique({
      where: { batchRecordId_sectionNumber: { batchRecordId: batchId, sectionNumber: 5 } },
      include: { approvedByUser: { select: { fullName: true } } },
    }),
  ])
  const canEdit = canAccessSection(user.role, 5, 'edit')
  const canApprove = canAccessSection(user.role, 5, 'signoff')

  // Prisma's Decimal is a class instance, not a plain object — it can't
  // cross the Server -> Client Component boundary as a prop, so convert to
  // string here rather than at display time inside the client table.
  const serializedEntries = entries.map((e) => ({
    ...e,
    acceptableTempMinF: e.acceptableTempMinF.toString(),
    acceptableTempMaxF: e.acceptableTempMaxF.toString(),
    actualTempF: e.actualTempF.toString(),
  }))

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 5: Raw Material Temperatures</h1>
        {canApprove && (
          <ApproveSectionControl
            batchRecordId={batchId}
            sectionNumber={5}
            hasEntries={entries.length > 0}
            approvedByName={sectionStatus?.approvedByUser?.fullName ?? null}
            approvedAt={sectionStatus?.approvedAt ?? null}
          />
        )}
      </div>

      <TemperatureLogTable entries={serializedEntries} batchRecordId={batchId} canCorrect={canEdit} />

      {canEdit && <TemperatureForm batchRecordId={batchId} />}
    </div>
  )
}
