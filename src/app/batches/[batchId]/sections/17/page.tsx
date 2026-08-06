import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { ReleaseDecisionForm } from './ReleaseDecisionForm'

export default async function Section17Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 17, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({
    where: { id: batchId },
    include: { releaseDecision: { include: { reviewedBy: true } } },
  })
  if (!batch) notFound()

  const canEdit = canAccessSection(user.role, 17, 'edit') && batch.status === 'PENDING_QC_REVIEW' && !batch.releaseDecision

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 17: Batch Release Decision</h1>

      {batch.status !== 'PENDING_QC_REVIEW' && !batch.releaseDecision && (
        <p className="text-sm text-zinc-500">
          This batch is not yet pending QC review (current status: {batch.status.replaceAll('_', ' ')}).
        </p>
      )}

      {batch.releaseDecision ? (
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm max-w-lg">
          <dt className="text-zinc-500">Finished product spec ref</dt>
          <dd>{batch.releaseDecision.finishedProductSpecRef}</dd>
          <dt className="text-zinc-500">In-process results reviewed</dt>
          <dd>{batch.releaseDecision.inProcessResultsReviewed ? 'Yes' : 'N/A'}</dd>
          <dt className="text-zinc-500">OOS / pending results</dt>
          <dd>{batch.releaseDecision.oosResultsPending ? 'Yes' : 'No'}</dd>
          <dt className="text-zinc-500">Decision</dt>
          <dd>{batch.releaseDecision.decision}</dd>
          <dt className="text-zinc-500">Rationale</dt>
          <dd>{batch.releaseDecision.decisionBasisRationale}</dd>
          <dt className="text-zinc-500">Reviewed by</dt>
          <dd>
            {batch.releaseDecision.reviewedBy?.fullName} on{' '}
            {batch.releaseDecision.reviewDate?.toISOString().slice(0, 10)}
          </dd>
        </dl>
      ) : canEdit ? (
        <ReleaseDecisionForm batchRecordId={batch.id} />
      ) : null}
    </div>
  )
}
