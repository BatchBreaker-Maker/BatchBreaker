import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { DeviationEntryForm } from './DeviationEntryForm'
import { ResolveDeviationForm } from './ResolveDeviationForm'
import { confirmNoDeviations } from '@/server/deviations/actions'

const TYPE_LABELS: Record<string, string> = {
  INCIDENT: 'Incident',
  DEVIATION: 'Deviation',
  CRITICAL_DEVIATION: 'Critical Deviation',
}

export default async function Section14Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 14, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({
    where: { id: batchId },
    include: { noDeviationsConfirmedByUser: true },
  })
  if (!batch) notFound()

  const [entries, users] = await Promise.all([
    prisma.deviationEntry.findMany({
      where: { batchRecordId: batchId },
      orderBy: { sequenceNumber: 'asc' },
      include: { reportedToUser: true, resolvedByUser: true },
    }),
    prisma.user.findMany({ orderBy: { fullName: 'asc' } }),
  ])

  const canEdit = canAccessSection(user.role, 14, 'edit')
  const canResolve = canAccessSection(user.role, 14, 'signoff')
  const noDeviationsConfirmed = Boolean(batch.noDeviationsConfirmedDate)

  return (
    <div className="flex flex-col gap-8 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 14: Deviations &amp; Incidents</h1>

      {noDeviationsConfirmed && (
        <p className="text-sm text-green-700 dark:text-green-500">
          No deviations confirmed by {batch.noDeviationsConfirmedByUser?.fullName} on{' '}
          {batch.noDeviationsConfirmedDate!.toISOString().slice(0, 10)}.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Date/Time</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Description</th>
                <th className="py-2 pr-3">Corrective Action</th>
                <th className="py-2 pr-3">Reported To</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-zinc-100 align-top dark:border-zinc-900">
                  <td className="py-2 pr-3">{e.sequenceNumber}</td>
                  <td className="py-2 pr-3">{e.dateTime.toISOString().slice(0, 16).replace('T', ' ')}</td>
                  <td className="py-2 pr-3">{TYPE_LABELS[e.type]}</td>
                  <td className="py-2 pr-3 max-w-xs whitespace-pre-wrap">{e.description}</td>
                  <td className="py-2 pr-3 max-w-xs whitespace-pre-wrap">{e.correctiveActionTaken}</td>
                  <td className="py-2 pr-3">{e.reportedToUser?.fullName ?? '—'}</td>
                  <td className="py-2 pr-3">
                    {e.status === 'OPEN' ? (
                      <span className="font-medium text-red-600">Open</span>
                    ) : (
                      <span className="text-green-700 dark:text-green-500">
                        {e.status === 'RESOLVED' ? 'Resolved' : 'Closed'} by {e.resolvedByUser?.fullName}
                        {e.resolutionRationale ? ` — ${e.resolutionRationale}` : ''}
                      </span>
                    )}
                    {e.status === 'OPEN' && canResolve && (
                      <ResolveDeviationForm batchRecordId={batchId} deviationId={e.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && <p className="text-sm text-zinc-500">No deviations logged.</p>}
        </div>

        {canEdit && !noDeviationsConfirmed && (
          <div className="flex flex-col gap-3">
            <DeviationEntryForm batchRecordId={batchId} users={users.map((u) => ({ id: u.id, fullName: u.fullName }))} />
            {entries.length === 0 && (
              <form action={confirmNoDeviations}>
                <input type="hidden" name="batchRecordId" value={batchId} />
                <button
                  type="submit"
                  className="rounded border border-zinc-400 px-4 py-2 text-sm font-medium dark:border-zinc-600"
                >
                  Confirm no deviations occurred for this batch
                </button>
              </form>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
