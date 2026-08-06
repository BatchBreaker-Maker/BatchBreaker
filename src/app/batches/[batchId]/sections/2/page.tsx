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
  const batch = await prisma.batchRecord.findUnique({
    where: { id: batchId },
    include: { personnel: true },
  })
  if (!batch) notFound()

  const canEdit = canAccessSection(user.role, 2, 'edit')

  const [operators, headsOfProduction, qcReviewers] = await Promise.all([
    prisma.user.findMany({ where: { role: 'PRODUCTION_OPERATOR', isActive: true }, orderBy: { fullName: 'asc' } }),
    prisma.user.findMany({ where: { role: 'HEAD_OF_PRODUCTION', isActive: true }, orderBy: { fullName: 'asc' } }),
    prisma.user.findMany({ where: { role: 'QUALITY_UNIT', isActive: true }, orderBy: { fullName: 'asc' } }),
  ])

  const current = {
    operatorUserId: batch.personnel.find((p) => p.roleInBatch === 'OPERATOR')?.userId,
    headOfProductionUserId: batch.personnel.find((p) => p.roleInBatch === 'HEAD_OF_PRODUCTION')?.userId,
    qcReviewerUserId: batch.personnel.find((p) => p.roleInBatch === 'QC_REVIEWER')?.userId,
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 2: Production Personnel</h1>
      </div>
      {canEdit ? (
        <PersonnelForm
          batchRecordId={batch.id}
          operators={operators}
          headsOfProduction={headsOfProduction}
          qcReviewers={qcReviewers}
          current={current}
        />
      ) : (
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm max-w-md">
          <dt className="text-zinc-500">Operator</dt>
          <dd>{operators.find((u) => u.id === current.operatorUserId)?.fullName ?? '—'}</dd>
          <dt className="text-zinc-500">Head of Production</dt>
          <dd>{headsOfProduction.find((u) => u.id === current.headOfProductionUserId)?.fullName ?? '—'}</dd>
          <dt className="text-zinc-500">QC Reviewer</dt>
          <dd>{qcReviewers.find((u) => u.id === current.qcReviewerUserId)?.fullName ?? '—'}</dd>
        </dl>
      )}
    </div>
  )
}
