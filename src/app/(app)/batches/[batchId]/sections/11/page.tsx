import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { PrePackagingChecklistForm } from './PrePackagingChecklistForm'
import { PackagingCheckForm } from './PackagingCheckForm'
import { PackagingReturnForm } from './PackagingReturnForm'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui'

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
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
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
    <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 11: Packaging Operations</h1>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">11.1 — Pre-Packaging Checklist</h2>
        {canEdit && <PrePackagingChecklistForm batchRecordId={batchId} verifiedItems={verifiedItems} />}
      </section>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">11.2 — In-Process Packaging Checks</h2>
        <Table>
          <THead>
            <TR>
              <TH>#</TH>
              <TH>Time</TH>
              <TH>Component</TH>
              <TH>Label</TH>
              <TH>Appearance</TH>
              <TH>Fill/Weight</TH>
            </TR>
          </THead>
          <TBody>
            {checks.map((c) => (
              <TR key={c.id}>
                <TD>{c.checkNumber}</TD>
                <TD>{c.time.toISOString().slice(0, 16).replace('T', ' ')}</TD>
                <TD className={!c.componentCorrect ? 'font-medium text-danger' : ''}>{c.componentCorrect ? 'OK' : 'Issue'}</TD>
                <TD className={!c.labelCorrect ? 'font-medium text-danger' : ''}>{c.labelCorrect ? 'OK' : 'Issue'}</TD>
                <TD className={!c.appearanceOk ? 'font-medium text-danger' : ''}>{c.appearanceOk ? 'OK' : 'Issue'}</TD>
                <TD className={!c.fillWeightOk ? 'font-medium text-danger' : ''}>{c.fillWeightOk ? 'OK' : 'Issue'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {checks.length === 0 && <p className="text-sm text-text-muted">No in-process checks logged yet.</p>}
        {canEdit && <PackagingCheckForm batchRecordId={batchId} />}
      </section>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">11.3 — Unused Packaging Return</h2>
        {canEdit && <PackagingReturnForm batchRecordId={batchId} existing={packagingReturn} />}
      </section>
    </div>
  )
}
