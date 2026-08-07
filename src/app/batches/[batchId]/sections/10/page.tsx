import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { YieldForm } from './YieldForm'

export default async function Section10Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 10, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const yieldRec = await prisma.yieldReconciliation.findUnique({ where: { batchRecordId: batchId } })
  const canEdit = canAccessSection(user.role, 10, 'edit')

  let variance: number | null = null
  let variancePct: number | null = null
  if (yieldRec) {
    const expected = Number(yieldRec.expectedYield)
    const actual = Number(yieldRec.actualYield)
    variance = actual - expected
    variancePct = expected !== 0 ? (variance / expected) * 100 : 0
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 10: Yield Reconciliation</h1>

      {yieldRec && (
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm max-w-lg">
          <dt className="text-zinc-500">Variance</dt>
          <dd>{variance?.toFixed(3)} {yieldRec.actualYieldUnit}</dd>
          <dt className="text-zinc-500">Variance %</dt>
          <dd className={Math.abs(variancePct ?? 0) > 5 ? 'font-medium text-amber-700 dark:text-amber-500' : ''}>
            {variancePct?.toFixed(2)}%
          </dd>
        </dl>
      )}

      {canEdit && <YieldForm batchRecordId={batchId} existing={yieldRec} />}
    </div>
  )
}
