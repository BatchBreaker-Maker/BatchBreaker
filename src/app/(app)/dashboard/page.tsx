import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { destructionLookaheadCutoff } from '@/lib/retainedSample/destructionWindow'
import { batchNeedsInput } from '@/lib/workflow/batchProgress'
import { Badge, Button, buttonClassName, Card, CardTitle, Input, Label, NeedsInputFlag, Select } from '@/components/ui'
import type { BadgeStatus } from '@/components/ui/Badge'
import type { BatchStatus } from '@/generated/prisma/enums'

const NOTIFIED_ROLES = ['HEAD_OF_PRODUCTION', 'HEAD_OF_QC', 'QC_USER']
const DESTRUCTION_LOOKAHEAD_DAYS = 30

const BATCH_STATUS_BADGE: Record<string, BadgeStatus> = {
  DRAFT: 'neutral',
  IN_PROGRESS: 'warning',
  PENDING_HOP_REVIEW: 'warning',
  PENDING_QC_REVIEW: 'warning',
  RELEASED: 'success',
  REJECTED: 'danger',
  QUARANTINED: 'danger',
  ON_HOLD: 'neutral',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')

  const { q, status } = await searchParams
  const query = q?.trim() ?? ''
  const statusFilter = status && status in BATCH_STATUS_BADGE ? (status as BatchStatus) : null
  const isFiltered = query !== '' || statusFilter !== null

  const canCreateBatch = canAccessSection(user.role, 1, 'edit')
  const batches = canAccessSection(user.role, 1, 'view')
    ? await prisma.batchRecord.findMany({
        where: {
          ...(query ? { batchNumber: { contains: query, mode: 'insensitive' } } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          sectionStatuses: { select: { sectionNumber: true, status: true } },
          releaseDecision: { select: { decision: true } },
          signOffs: { select: { role: true } },
        },
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
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text">Welcome, {user.fullName}</h1>
        {canCreateBatch && (
          <Link href="/batches/new" className={buttonClassName('primary')}>
            + New batch record
          </Link>
        )}
      </div>

      {showNotifications && (openCriticalDeviations.length > 0 || samplesApproachingDestruction.length > 0) && (
        <section className="flex flex-col gap-4">
          {openCriticalDeviations.length > 0 && (
            <Card className="border-danger/30 bg-danger/5">
              <CardTitle className="text-danger">Open critical deviations ({openCriticalDeviations.length})</CardTitle>
              <ul className="mt-2 flex flex-col divide-y divide-border">
                {openCriticalDeviations.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                    <Link
                      href={`/batches/${d.batchRecordId}/sections/14`}
                      prefetch={false}
                      className="min-w-0 truncate hover:underline"
                    >
                      {d.batchRecord.batchNumber} — {d.description.slice(0, 80)}
                    </Link>
                    <span className="shrink-0 text-xs text-text-muted">{d.dateTime.toISOString().slice(0, 10)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {samplesApproachingDestruction.length > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardTitle className="text-warning">
                Retained samples approaching destruction ({samplesApproachingDestruction.length})
              </CardTitle>
              <ul className="mt-2 flex flex-col divide-y divide-border">
                {samplesApproachingDestruction.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                    <Link
                      href={`/batches/${s.batchRecordId}/sections/12`}
                      prefetch={false}
                      className="min-w-0 truncate hover:underline"
                    >
                      {s.batchRecord.batchNumber}
                    </Link>
                    <span className="shrink-0 text-xs text-text-muted">
                      {s.scheduledDestructionReviewDate.toISOString().slice(0, 10)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">Batch records</h2>
        <form action="/dashboard" className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="q">Batch number</Label>
            <Input
              id="q"
              name="q"
              type="search"
              placeholder="Search batch number…"
              defaultValue={query}
              className="w-56"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={statusFilter ?? ''} className="w-48">
              <option value="">All statuses</option>
              {Object.keys(BATCH_STATUS_BADGE).map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll('_', ' ')}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {isFiltered && (
            <Link href="/dashboard" prefetch={false} className="text-sm text-text-muted hover:text-text hover:underline">
              Clear
            </Link>
          )}
        </form>
        {batches.length === 0 ? (
          <p className="text-sm text-text-muted">
            {isFiltered ? 'No batch records match your search.' : 'No batch records yet.'}
          </p>
        ) : (
          <ul className="flex max-w-2xl flex-col divide-y divide-border">
            {batches.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-4 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Link href={`/batches/${b.id}`} prefetch={false} className="min-w-0 truncate text-sm hover:underline">
                    {b.batchNumber} — {b.productName}
                  </Link>
                  {batchNeedsInput(
                    user.role,
                    b.productType,
                    b.status,
                    b.sectionStatuses,
                    !!b.releaseDecision?.decision,
                    b.signOffs.map((s) => s.role),
                  ) && <NeedsInputFlag />}
                </span>
                <Badge status={BATCH_STATUS_BADGE[b.status] ?? 'neutral'}>{b.status.replaceAll('_', ' ')}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
