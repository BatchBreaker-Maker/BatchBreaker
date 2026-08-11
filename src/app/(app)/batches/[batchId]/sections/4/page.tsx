import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { ApproveSectionControl } from '@/components/workflow/ApproveSectionControl'
import { RawMaterialForm } from './RawMaterialForm'
import { RawMaterialLogTable } from './RawMaterialLogTable'

export default async function Section4Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 4, 'view')) {
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
    prisma.rawMaterialEntry.findMany({
      where: { batchRecordId: batchId },
      orderBy: { lineNumber: 'asc' },
      include: { correctedByEntries: { select: { id: true } } },
    }),
    prisma.sectionCompletionStatus.findUnique({
      where: { batchRecordId_sectionNumber: { batchRecordId: batchId, sectionNumber: 4 } },
      include: { approvedByUser: { select: { fullName: true } } },
    }),
  ])
  const canEdit = canAccessSection(user.role, 4, 'edit')
  const canApprove = canAccessSection(user.role, 4, 'signoff')

  // Prisma's Decimal is a class instance, not a plain object — it can't
  // cross the Server -> Client Component boundary as a prop, so convert to
  // string here rather than at display time inside the client table.
  const serializedEntries = entries.map((e) => ({
    ...e,
    qtyDispensed: e.qtyDispensed.toString(),
  }))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 4: Raw Material Log</h1>
        {canApprove && (
          <ApproveSectionControl
            batchRecordId={batchId}
            sectionNumber={4}
            hasEntries={entries.length > 0}
            approvedByName={sectionStatus?.approvedByUser?.fullName ?? null}
            approvedAt={sectionStatus?.approvedAt ?? null}
          />
        )}
      </div>

      <RawMaterialLogTable entries={serializedEntries} batchRecordId={batchId} canCorrect={canEdit} />

      {canEdit && <RawMaterialForm batchRecordId={batchId} />}
    </div>
  )
}
