import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { StampingSetupForm } from './StampingSetupForm'
import { PressRunForm } from './PressRunForm'

export default async function Section8Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 8, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const [setup, runs] = await Promise.all([
    prisma.stampingSetup.findUnique({ where: { batchRecordId: batchId } }),
    prisma.pressRun.findMany({ where: { batchRecordId: batchId }, orderBy: { dateTime: 'asc' } }),
  ])
  const canEdit = canAccessSection(user.role, 8, 'edit')

  return (
    <div className="flex flex-col gap-8 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 8: Bar Stamping / Press Operations</h1>

      <section className="flex flex-col gap-3 max-w-2xl">
        <h2 className="font-medium">8.1 — Press Setup Verification</h2>
        {canEdit && <StampingSetupForm batchRecordId={batchId} existing={setup} />}
      </section>

      <section className="flex flex-col gap-3 max-w-2xl">
        <h2 className="font-medium">8.2 — Stamping / Press Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
                <th className="py-2 pr-3">Date/Time</th>
                <th className="py-2 pr-3">Die/Stamp</th>
                <th className="py-2 pr-3">Impression</th>
                <th className="py-2 pr-3">Surface</th>
                <th className="py-2 pr-3">OK?</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-3">{r.dateTime.toISOString().slice(0, 16).replace('T', ' ')}</td>
                  <td className="py-2 pr-3">{r.dieStampId}</td>
                  <td className="py-2 pr-3">{r.impressionQuality || '—'}</td>
                  <td className="py-2 pr-3">{r.barSurfaceCondition || '—'}</td>
                  <td className="py-2 pr-3">{r.appearanceOk ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {runs.length === 0 && <p className="text-sm text-zinc-500">No press runs logged yet.</p>}
        </div>
        {canEdit && <PressRunForm batchRecordId={batchId} />}
      </section>
    </div>
  )
}
