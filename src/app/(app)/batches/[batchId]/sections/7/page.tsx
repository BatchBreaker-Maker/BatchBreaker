import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { saveCuttingOverallComments } from '@/server/cutting/actions'
import { CuttingObservationForm } from './CuttingObservationForm'

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
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const observations = await prisma.cuttingObservation.findMany({
    where: { batchRecordId: batchId },
    orderBy: { pourNumber: 'asc' },
  })
  const canEdit = canAccessSection(user.role, 7, 'edit')

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 7: Soap Block Cutting Observations</h1>

      <div className="overflow-x-auto max-w-4xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
              <th className="py-2 pr-3">Pour</th>
              <th className="py-2 pr-3">Top</th>
              <th className="py-2 pr-3">Side</th>
              <th className="py-2 pr-3">Middle</th>
              <th className="py-2 pr-3">Color</th>
              <th className="py-2 pr-3">Separation?</th>
              <th className="py-2 pr-3">Foreign Matter?</th>
              <th className="py-2 pr-3">Comments</th>
            </tr>
          </thead>
          <tbody>
            {observations.map((o) => (
              <tr key={o.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2 pr-3">{o.pourNumber}</td>
                <td className="py-2 pr-3">{o.tempTopF?.toString() ?? '—'}</td>
                <td className="py-2 pr-3">{o.tempSideF?.toString() ?? '—'}</td>
                <td className="py-2 pr-3">{o.tempMiddleF?.toString() ?? '—'}</td>
                <td className="py-2 pr-3">{o.colorUniformity || '—'}</td>
                <td className="py-2 pr-3">{o.visibleSeparation ? 'Yes' : 'No'}</td>
                <td className="py-2 pr-3">{o.foreignMatter ? 'Yes' : 'No'}</td>
                <td className="py-2 pr-3">{o.fragranceAdditionalComments || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {observations.length === 0 && <p className="text-sm text-zinc-500">No cutting observations yet.</p>}
      </div>

      {canEdit && <CuttingObservationForm batchRecordId={batchId} />}

      <section className="flex flex-col gap-2 max-w-2xl">
        <h2 className="font-medium">Overall Cutting Observations / Additional Comments</h2>
        {canEdit ? (
          <form action={saveCuttingOverallComments} className="flex flex-col gap-2">
            <input type="hidden" name="batchRecordId" value={batchId} />
            <textarea
              name="cuttingOverallComments"
              rows={3}
              defaultValue={batch.cuttingOverallComments ?? ''}
              className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button type="submit" className="self-start rounded border px-4 py-2 text-sm font-medium">
              Save comments
            </button>
          </form>
        ) : (
          <p className="text-sm">{batch.cuttingOverallComments || '—'}</p>
        )}
      </section>
    </div>
  )
}
