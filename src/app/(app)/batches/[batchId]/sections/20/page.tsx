import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui'

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
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
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
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 20: Change History</h1>
        <p className="text-sm text-text-muted">System-generated. Every recorded action on this batch, in order.</p>
      </div>

      <div className="max-w-4xl">
        <Table>
          <THead>
            <TR>
              <TH>Timestamp (UTC)</TH>
              <TH>User</TH>
              <TH>Action</TH>
              <TH>Entity</TH>
              <TH>Field</TH>
              <TH>Change</TH>
            </TR>
          </THead>
          <TBody>
            {entries.map((e) => (
              <TR key={e.id} className="align-top">
                <TD className="whitespace-nowrap">{e.timestamp.toISOString().replace('T', ' ').slice(0, 19)}</TD>
                <TD className="whitespace-nowrap">{e.user?.fullName ?? e.attemptedUsername ?? '—'}</TD>
                <TD className="whitespace-nowrap">{e.actionType.replaceAll('_', ' ')}</TD>
                <TD className="whitespace-nowrap">{e.entityType}</TD>
                <TD className="whitespace-nowrap">{e.fieldName ?? '—'}</TD>
                <TD>
                  {e.oldValue || e.newValue
                    ? `${e.oldValue ?? '—'} → ${e.newValue ?? '—'}`
                    : e.correctionReason
                      ? `Reason: ${e.correctionReason}`
                      : '—'}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {entries.length === 0 && <p className="mt-2 text-sm text-text-muted">No recorded activity yet.</p>}
      </div>
    </div>
  )
}
