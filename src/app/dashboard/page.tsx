import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { logout } from '@/lib/auth/actions'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { destructionLookaheadCutoff } from '@/lib/retainedSample/destructionWindow'

const NOTIFIED_ROLES = ['HEAD_OF_PRODUCTION', 'QUALITY_UNIT']
const DESTRUCTION_LOOKAHEAD_DAYS = 30

export default async function DashboardPage() {
  const user = await verifySession()
  if (!user) redirect('/login')

  const canCreateBatch = canAccessSection(user.role, 1, 'edit')
  const batches = canAccessSection(user.role, 1, 'view')
    ? await prisma.batchRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : []

  const showNotifications = NOTIFIED_ROLES.includes(user.role)
  const [openCriticalDeviations, samplesApproachingDestruction] = showNotifications
    ? await Promise.all([
        prisma.deviationEntry.findMany({
          where: { type: 'CRITICAL_DEVIATION', status: 'OPEN' },
          include: { batchRecord: true },
          orderBy: { dateTime: 'desc' },
        }),
        prisma.retainedSampleRecord.findMany({
          where: {
            destructionDate: null,
            scheduledDestructionReviewDate: { lte: destructionLookaheadCutoff(DESTRUCTION_LOOKAHEAD_DAYS) },
          },
          include: { batchRecord: true },
          orderBy: { scheduledDestructionReviewDate: 'asc' },
        }),
      ])
    : [[], []]

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Welcome, {user.fullName}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Role: {user.role.replaceAll('_', ' ')}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="rounded border px-4 py-2 text-sm">
            Sign out
          </button>
        </form>
      </div>

      {canCreateBatch && (
        <Link
          href="/batches/new"
          className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + New batch record
        </Link>
      )}

      {showNotifications && (openCriticalDeviations.length > 0 || samplesApproachingDestruction.length > 0) && (
        <section className="flex flex-col gap-4">
          {openCriticalDeviations.length > 0 && (
            <div className="flex flex-col gap-2 rounded border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <h2 className="font-medium text-red-800 dark:text-red-400">
                Open critical deviations ({openCriticalDeviations.length})
              </h2>
              <ul className="flex flex-col divide-y divide-red-200 dark:divide-red-900">
                {openCriticalDeviations.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-1.5 text-sm">
                    <Link href={`/batches/${d.batchRecordId}/sections/14`} prefetch={false} className="hover:underline">
                      {d.batchRecord.batchNumber} — {d.description.slice(0, 80)}
                    </Link>
                    <span className="text-xs text-zinc-500">{d.dateTime.toISOString().slice(0, 10)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {samplesApproachingDestruction.length > 0 && (
            <div className="flex flex-col gap-2 rounded border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <h2 className="font-medium text-amber-800 dark:text-amber-400">
                Retained samples approaching destruction ({samplesApproachingDestruction.length})
              </h2>
              <ul className="flex flex-col divide-y divide-amber-200 dark:divide-amber-900">
                {samplesApproachingDestruction.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-1.5 text-sm">
                    <Link href={`/batches/${s.batchRecordId}/sections/12`} prefetch={false} className="hover:underline">
                      {s.batchRecord.batchNumber}
                    </Link>
                    <span className="text-xs text-zinc-500">{s.scheduledDestructionReviewDate.toISOString().slice(0, 10)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Batch records</h2>
        {batches.length === 0 ? (
          <p className="text-sm text-zinc-500">No batch records yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800 max-w-2xl">
            {batches.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <Link href={`/batches/${b.id}`} prefetch={false} className="hover:underline">
                  {b.batchNumber} — {b.productName}
                </Link>
                <span className="text-xs text-zinc-500">{b.status.replaceAll('_', ' ')}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
