import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { ProcessingStepForm } from './ProcessingStepForm'
import { HomogeneityChecksForm } from './HomogeneityChecksForm'
import { CureRecordForm } from './CureRecordForm'

export default async function Section6Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 6, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const [steps, homogeneityChecks, cureRecords] = await Promise.all([
    prisma.processingStep.findMany({ where: { batchRecordId: batchId }, orderBy: { timePerformed: 'asc' } }),
    prisma.homogeneityCheck.findMany({ where: { batchRecordId: batchId } }),
    prisma.cureRecord.findMany({ where: { batchRecordId: batchId } }),
  ])
  const canEdit = canAccessSection(user.role, 6, 'edit')
  const homogeneityByItem = Object.fromEntries(homogeneityChecks.map((c) => [c.checkItem, c]))
  const preCut = cureRecords.find((c) => c.phase === 'PRE_CUT')
  const postCut = cureRecords.find((c) => c.phase === 'POST_CUT')

  return (
    <div className="flex flex-col gap-8 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 6: In-Process Production Record</h1>

      <section className="flex flex-col gap-3 max-w-2xl">
        <h2 className="font-medium">6.1 — Processing Steps &amp; Observations</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {steps.map((s) => (
            <li key={s.id} className="border-b border-zinc-100 pb-2 dark:border-zinc-900">
              <span className="font-medium">Step {s.stepNumber}:</span> {s.stepDescription}
              <div className="text-xs text-zinc-500">
                {s.timePerformed.toISOString().slice(0, 16).replace('T', ' ')}
                {s.observationsNotes ? ` — ${s.observationsNotes}` : ''}
              </div>
            </li>
          ))}
        </ul>
        {canEdit && <ProcessingStepForm batchRecordId={batchId} />}
      </section>

      <section className="flex flex-col gap-3 max-w-2xl">
        <h2 className="font-medium">6.2 — Visual Homogeneity &amp; Consistency Checks</h2>
        {canEdit ? (
          <HomogeneityChecksForm batchRecordId={batchId} existing={homogeneityByItem} />
        ) : (
          <ul className="text-sm">
            {Object.entries(homogeneityByItem).map(([key, c]) => (
              <li key={key}>{key}: {c.result ?? 'not recorded'}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 max-w-2xl">
        <h2 className="font-medium">6.3 — Cure/Hold Record (Pre-Cut)</h2>
        {canEdit && <CureRecordForm batchRecordId={batchId} phase="PRE_CUT" existing={preCut} />}
      </section>

      <section className="flex flex-col gap-3 max-w-2xl">
        <h2 className="font-medium">6.4 — Cure/Hold Record (Post-Cut)</h2>
        {canEdit && <CureRecordForm batchRecordId={batchId} phase="POST_CUT" existing={postCut} />}
      </section>
    </div>
  )
}
