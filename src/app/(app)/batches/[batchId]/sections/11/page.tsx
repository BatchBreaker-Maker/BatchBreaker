import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { PrePackagingChecklistForm } from './PrePackagingChecklistForm'
import { PackagingCheckForm } from './PackagingCheckForm'
import { PackagingReturnForm } from './PackagingReturnForm'

export default async function Section11Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 11, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const [checklistItems, checks, packagingReturn] = await Promise.all([
    prisma.prePackagingChecklistItem.findMany({ where: { batchRecordId: batchId } }),
    prisma.packagingCheck.findMany({ where: { batchRecordId: batchId }, orderBy: { checkNumber: 'asc' } }),
    prisma.packagingReturn.findUnique({ where: { batchRecordId: batchId } }),
  ])
  const canEdit = canAccessSection(user.role, 11, 'edit')
  const verifiedItems = new Set(checklistItems.filter((i) => i.verified).map((i) => i.itemKey))

  return (
    <div className="flex flex-col gap-8 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 11: Packaging Operations</h1>

      <section className="flex flex-col gap-3 max-w-2xl">
        <h2 className="font-medium">11.1 — Pre-Packaging Checklist</h2>
        {canEdit && <PrePackagingChecklistForm batchRecordId={batchId} verifiedItems={verifiedItems} />}
      </section>

      <section className="flex flex-col gap-3 max-w-2xl">
        <h2 className="font-medium">11.2 — In-Process Packaging Checks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Component</th>
                <th className="py-2 pr-3">Label</th>
                <th className="py-2 pr-3">Appearance</th>
                <th className="py-2 pr-3">Fill/Weight</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-3">{c.checkNumber}</td>
                  <td className="py-2 pr-3">{c.time.toISOString().slice(0, 16).replace('T', ' ')}</td>
                  <td className="py-2 pr-3">{c.componentCorrect ? 'OK' : 'Issue'}</td>
                  <td className="py-2 pr-3">{c.labelCorrect ? 'OK' : 'Issue'}</td>
                  <td className="py-2 pr-3">{c.appearanceOk ? 'OK' : 'Issue'}</td>
                  <td className="py-2 pr-3">{c.fillWeightOk ? 'OK' : 'Issue'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {checks.length === 0 && <p className="text-sm text-zinc-500">No in-process checks logged yet.</p>}
        </div>
        {canEdit && <PackagingCheckForm batchRecordId={batchId} />}
      </section>

      <section className="flex flex-col gap-3 max-w-2xl">
        <h2 className="font-medium">11.3 — Unused Packaging Return</h2>
        {canEdit && <PackagingReturnForm batchRecordId={batchId} existing={packagingReturn} />}
      </section>
    </div>
  )
}
