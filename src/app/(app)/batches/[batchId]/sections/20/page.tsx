import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'

export default async function Section20Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 20, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const entries = await prisma.auditTrailEntry.findMany({
    where: { batchRecordId: batchId },
    include: { user: true },
    orderBy: { timestamp: 'asc' },
  })

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 20: Change History</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          System-generated. Every recorded action on this batch, in order.
        </p>
      </div>

      <div className="overflow-x-auto max-w-4xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
              <th className="py-2 pr-4">Timestamp (UTC)</th>
              <th className="py-2 pr-4">User</th>
              <th className="py-2 pr-4">Action</th>
              <th className="py-2 pr-4">Entity</th>
              <th className="py-2 pr-4">Field</th>
              <th className="py-2 pr-4">Change</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-zinc-100 align-top dark:border-zinc-900">
                <td className="py-2 pr-4 whitespace-nowrap">{e.timestamp.toISOString().replace('T', ' ').slice(0, 19)}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{e.user?.fullName ?? e.attemptedUsername ?? '—'}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{e.actionType.replaceAll('_', ' ')}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{e.entityType}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{e.fieldName ?? '—'}</td>
                <td className="py-2 pr-4">
                  {e.oldValue || e.newValue
                    ? `${e.oldValue ?? '—'} → ${e.newValue ?? '—'}`
                    : e.correctionReason
                      ? `Reason: ${e.correctionReason}`
                      : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="text-sm text-zinc-500">No recorded activity yet.</p>}
      </div>
    </div>
  )
}
