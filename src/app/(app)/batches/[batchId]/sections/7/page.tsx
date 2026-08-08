import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { ApproveSectionControl } from '@/components/workflow/ApproveSectionControl'
import { saveCuttingOverallComments } from '@/server/cutting/actions'
import { CuttingObservationForm } from './CuttingObservationForm'
import { CuttingObservationLogTable } from './CuttingObservationLogTable'
import { Button, Textarea } from '@/components/ui'

export default async function Section7Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 7, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const [observations, sectionStatus] = await Promise.all([
    prisma.cuttingObservation.findMany({
      where: { batchRecordId: batchId },
      orderBy: { pourNumber: 'asc' },
      include: { correctedByEntries: { select: { id: true } } },
    }),
    prisma.sectionCompletionStatus.findUnique({
      where: { batchRecordId_sectionNumber: { batchRecordId: batchId, sectionNumber: 7 } },
      include: { approvedByUser: { select: { fullName: true } } },
    }),
  ])
  const canEdit = canAccessSection(user.role, 7, 'edit')
  const canApprove = canAccessSection(user.role, 7, 'signoff')

  // Prisma's Decimal is a class instance, not a plain object — it can't
  // cross the Server -> Client Component boundary as a prop, so convert the
  // nullable temps to string|null here rather than at display time.
  const serializedObservations = observations.map((o) => ({
    ...o,
    tempTopF: o.tempTopF?.toString() ?? null,
    tempSideF: o.tempSideF?.toString() ?? null,
    tempMiddleF: o.tempMiddleF?.toString() ?? null,
  }))

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 7: Soap Block Cutting Observations</h1>
        {canApprove && (
          <ApproveSectionControl
            batchRecordId={batchId}
            sectionNumber={7}
            hasEntries={observations.length > 0}
            approvedByName={sectionStatus?.approvedByUser?.fullName ?? null}
            approvedAt={sectionStatus?.approvedAt ?? null}
          />
        )}
      </div>

      <CuttingObservationLogTable observations={serializedObservations} batchRecordId={batchId} canCorrect={canEdit} />

      {canEdit && <CuttingObservationForm batchRecordId={batchId} />}

      <section className="flex max-w-2xl flex-col gap-2">
        <h2 className="text-sm font-semibold text-text">Overall Cutting Observations / Additional Comments</h2>
        {canEdit ? (
          <form action={saveCuttingOverallComments} className="flex flex-col gap-2">
            <input type="hidden" name="batchRecordId" value={batchId} />
            <Textarea name="cuttingOverallComments" rows={3} defaultValue={batch.cuttingOverallComments ?? ''} />
            <Button type="submit" variant="secondary" className="self-start">
              Save comments
            </Button>
          </form>
        ) : (
          <p className="text-sm text-text">{batch.cuttingOverallComments || '—'}</p>
        )}
      </section>
    </div>
  )
}
