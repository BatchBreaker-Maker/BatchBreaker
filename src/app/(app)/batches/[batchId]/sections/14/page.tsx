import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { DeviationEntryForm } from './DeviationEntryForm'
import { ResolveDeviationForm } from './ResolveDeviationForm'
import { confirmNoDeviations } from '@/server/deviations/actions'
import { Badge, Button, TBody, TD, TH, THead, TR, Table } from '@/components/ui'
import type { BadgeStatus } from '@/components/ui/Badge'

const TYPE_LABELS: Record<string, string> = {
  INCIDENT: 'Incident',
  DEVIATION: 'Deviation',
  CRITICAL_DEVIATION: 'Critical Deviation',
}

const STATUS_BADGE: Record<string, BadgeStatus> = {
  OPEN: 'danger',
  RESOLVED: 'warning',
  CLOSED: 'success',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
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
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
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
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 14: Deviations &amp; Incidents</h1>

      {noDeviationsConfirmed && (
        <p className="text-sm text-success">
          No deviations confirmed by {batch.noDeviationsConfirmedByUser?.fullName} on{' '}
          {batch.noDeviationsConfirmedDate!.toISOString().slice(0, 10)}.
        </p>
      )}

      <section className="flex flex-col gap-4">
        <Table>
          <THead>
            <TR>
              <TH>#</TH>
              <TH>Date/Time</TH>
              <TH>Type</TH>
              <TH>Description</TH>
              <TH>Corrective Action</TH>
              <TH>Reported To</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {entries.map((e) => (
              <TR key={e.id} className="align-top">
                <TD>{e.sequenceNumber}</TD>
                <TD className="whitespace-nowrap">{e.dateTime.toISOString().slice(0, 16).replace('T', ' ')}</TD>
                <TD>{TYPE_LABELS[e.type]}</TD>
                <TD className="max-w-xs whitespace-pre-wrap">{e.description}</TD>
                <TD className="max-w-xs whitespace-pre-wrap">{e.correctiveActionTaken}</TD>
                <TD>{e.reportedToUser?.fullName ?? '—'}</TD>
                <TD>
                  <div className="flex flex-col items-start gap-2">
                    <Badge status={STATUS_BADGE[e.status] ?? 'neutral'}>{STATUS_LABELS[e.status] ?? e.status}</Badge>
                    {e.status !== 'OPEN' && (
                      <span className="text-xs text-text-muted">
                        Resolved by {e.resolvedByUser?.fullName}
                        {e.resolutionRationale ? ` — ${e.resolutionRationale}` : ''}
                      </span>
                    )}
                    {e.status === 'OPEN' && canResolve && (
                      <ResolveDeviationForm batchRecordId={batchId} deviationId={e.id} />
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {entries.length === 0 && <p className="text-sm text-text-muted">No deviations logged.</p>}

        {canEdit && !noDeviationsConfirmed && (
          <div className="flex flex-col gap-3">
            <DeviationEntryForm batchRecordId={batchId} users={users.map((u) => ({ id: u.id, fullName: u.fullName }))} />
            {entries.length === 0 && (
              <form action={confirmNoDeviations}>
                <input type="hidden" name="batchRecordId" value={batchId} />
                <Button type="submit" variant="secondary">
                  Confirm no deviations occurred for this batch
                </Button>
              </form>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
