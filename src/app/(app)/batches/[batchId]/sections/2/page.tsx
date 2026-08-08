import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { PersonnelForm } from './PersonnelForm'

export default async function Section2Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 2, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const canEdit = canAccessSection(user.role, 2, 'edit')
  // Prisma's list-field type claims this is never null, but rows created
  // before Section 2 has ever been saved genuinely have a null column (no
  // schema default) — normalize once here rather than trusting the type.
  const productionOperatorNames = batch.productionOperatorNames ?? []

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 2: Production Personnel</h1>
      {canEdit ? (
        <PersonnelForm
          batchRecordId={batch.id}
          current={{
            productionOperatorNames,
            headOfProductionName: batch.headOfProductionName,
            qcReviewerName: batch.qcReviewerName,
          }}
        />
      ) : (
        <dl className="grid max-w-md grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <dt className="text-text-muted">Production Operator(s)</dt>
          <dd className="text-text">{productionOperatorNames.length > 0 ? productionOperatorNames.join(', ') : '—'}</dd>
          <dt className="text-text-muted">Head of Production</dt>
          <dd className="text-text">{batch.headOfProductionName ?? '—'}</dd>
          <dt className="text-text-muted">QC Reviewer</dt>
          <dd className="text-text">{batch.qcReviewerName ?? '—'}</dd>
        </dl>
      )}
    </div>
  )
}
