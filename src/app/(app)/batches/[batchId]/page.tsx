import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { IMPLEMENTED_SECTIONS, SECTION_TITLES } from '@/lib/workflow/sections'
import { sectionDisplayStatus } from '@/lib/workflow/batchProgress'
import { Badge, Card } from '@/components/ui'
import { BatchIdentificationForm } from './BatchIdentificationForm'

export default async function BatchOverviewPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')

  if (!canAccessSection(user.role, 1, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">You do not have permission to view batch records.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({
    where: { id: batchId },
    include: { sectionStatuses: true },
  })
  if (!batch) notFound()

  const statusBySection = new Map(batch.sectionStatuses.map((s) => [s.sectionNumber, s.status]))
  const visibleSections = IMPLEMENTED_SECTIONS.filter((n) => canAccessSection(user.role, n, 'view'))
  const canEditIdentification = canAccessSection(user.role, 1, 'edit')

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-semibold text-text">{batch.batchNumber}</h1>
        <p className="text-sm text-text-muted">
          {batch.productName} {batch.productCodeSku ? `(${batch.productCodeSku})` : ''} — status: {batch.status.replaceAll('_', ' ')}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text">Section 1 — Batch Identification</h2>
        <Card className="mx-auto w-full max-w-2xl">
          <BatchIdentificationForm
            batchRecordId={batch.id}
            productName={batch.productName}
            productCodeSku={batch.productCodeSku}
            productType={batch.productType}
            formulaNumber={batch.formulaNumber}
            formulaVersion={batch.formulaVersion}
            batchSizeTarget={batch.batchSizeTarget.toString()}
            batchSizeUnit={batch.batchSizeUnit}
            productionDate={batch.productionDate.toISOString().slice(0, 10)}
            plannedCompletionDate={batch.plannedCompletionDate ? batch.plannedCompletionDate.toISOString().slice(0, 10) : null}
            retentionDeadline={batch.retentionDeadline.toISOString().slice(0, 10)}
            finishedProductSpecRef={batch.finishedProductSpecRef}
            manufacturingSiteRoom={batch.manufacturingSiteRoom}
            complaintRecallRef={batch.complaintRecallRef}
            adverseEventRef={batch.adverseEventRef}
            canEdit={canEditIdentification}
          />
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text">Sections</h2>
        <ul className="mx-auto flex w-full max-w-2xl flex-col divide-y divide-border">
          {visibleSections
            .filter((n) => n !== 1)
            .map((n) => (
              <li key={n} className="flex items-center justify-between gap-4 py-2">
                {/* prefetch=false: section state changes from other users' actions
                    (e.g. QC recording a decision), so a prefetched snapshot can go
                    stale before this link is clicked */}
                <Link href={`/batches/${batch.id}/sections/${n}`} prefetch={false} className="min-w-0 truncate text-sm hover:underline">
                  Section {n} — {SECTION_TITLES[n]}
                </Link>
                <Badge status={sectionDisplayStatus(n, user.role, statusBySection.get(n))}>
                  {(statusBySection.get(n) ?? 'NOT_STARTED').replaceAll('_', ' ')}
                </Badge>
              </li>
            ))}
        </ul>
      </section>
    </div>
  )
}
