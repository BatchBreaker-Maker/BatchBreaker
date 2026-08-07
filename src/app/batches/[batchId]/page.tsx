import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { IMPLEMENTED_SECTIONS, SECTION_TITLES } from '@/lib/workflow/sections'

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
        <p className="text-sm text-red-600">You do not have permission to view batch records.</p>
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

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-xl font-semibold">{batch.batchNumber}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {batch.productName} {batch.productCodeSku ? `(${batch.productCodeSku})` : ''} — status: {batch.status.replaceAll('_', ' ')}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Section 1 — Batch Identification</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm max-w-2xl">
          <dt className="text-zinc-500">Formula</dt>
          <dd>{batch.formulaNumber} v{batch.formulaVersion}</dd>
          <dt className="text-zinc-500">Batch size</dt>
          <dd>{batch.batchSizeTarget.toString()} {batch.batchSizeUnit}</dd>
          <dt className="text-zinc-500">Production date</dt>
          <dd>{batch.productionDate.toISOString().slice(0, 10)}</dd>
          <dt className="text-zinc-500">Manufacturing site / room</dt>
          <dd>{batch.manufacturingSiteRoom || '—'}</dd>
          <dt className="text-zinc-500">Complaint / recall ref</dt>
          <dd>{batch.complaintRecallRef || 'N/A'}</dd>
          <dt className="text-zinc-500">Adverse event ref</dt>
          <dd>{batch.adverseEventRef || 'N/A'}</dd>
          <dt className="text-zinc-500">Record retention deadline</dt>
          <dd>{batch.retentionDeadline.toISOString().slice(0, 10)}</dd>
        </dl>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Sections</h2>
        <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800 max-w-2xl">
          {visibleSections
            .filter((n) => n !== 1)
            .map((n) => (
              <li key={n} className="flex items-center justify-between py-2">
                {/* prefetch=false: section state changes from other users' actions
                    (e.g. QC recording a decision), so a prefetched snapshot can go
                    stale before this link is clicked */}
                <Link href={`/batches/${batch.id}/sections/${n}`} prefetch={false} className="hover:underline">
                  Section {n} — {SECTION_TITLES[n]}
                </Link>
                <span className="text-xs text-zinc-500">
                  {(statusBySection.get(n) ?? 'NOT_STARTED').replaceAll('_', ' ')}
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  )
}
