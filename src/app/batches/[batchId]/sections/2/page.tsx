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
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
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
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 2: Production Personnel</h1>
      </div>
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
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm max-w-md">
          <dt className="text-zinc-500">Production Operator(s)</dt>
          <dd>{productionOperatorNames.length > 0 ? productionOperatorNames.join(', ') : '—'}</dd>
          <dt className="text-zinc-500">Head of Production</dt>
          <dd>{batch.headOfProductionName ?? '—'}</dd>
          <dt className="text-zinc-500">QC Reviewer</dt>
          <dd>{batch.qcReviewerName ?? '—'}</dd>
        </dl>
      )}
    </div>
  )
}
