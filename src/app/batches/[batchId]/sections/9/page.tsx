import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { SamplingEntryForm } from './SamplingEntryForm'

export default async function Section9Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 9, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const entries = await prisma.samplingEntry.findMany({
    where: { batchRecordId: batchId },
    orderBy: { dateTime: 'asc' },
  })
  const canEdit = canAccessSection(user.role, 9, 'edit')

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 9: In-Process Sampling Log</h1>

      <div className="overflow-x-auto max-w-4xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
              <th className="py-2 pr-3">Date/Time</th>
              <th className="py-2 pr-3">Stage</th>
              <th className="py-2 pr-3">Test Type</th>
              <th className="py-2 pr-3">Result</th>
              <th className="py-2 pr-3">Disposition</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2 pr-3">{e.dateTime.toISOString().slice(0, 16).replace('T', ' ')}</td>
                <td className="py-2 pr-3">{e.samplingStage}</td>
                <td className="py-2 pr-3">{e.testType}</td>
                <td className="py-2 pr-3">{e.resultObservation || '—'}</td>
                <td className="py-2 pr-3">{e.disposition.replaceAll('_', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="text-sm text-zinc-500">No sampling entries yet.</p>}
      </div>

      {canEdit && <SamplingEntryForm batchRecordId={batchId} />}
    </div>
  )
}
