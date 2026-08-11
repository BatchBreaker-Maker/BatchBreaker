import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { ApproveSectionControl } from '@/components/workflow/ApproveSectionControl'
import { ProcessingStepForm } from './ProcessingStepForm'
import { AdditionalProcessingStepForm } from './AdditionalProcessingStepForm'
import { HomogeneityChecksForm } from './HomogeneityChecksForm'
import { CureRecordForm } from './CureRecordForm'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui'

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
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const [steps, additionalSteps, homogeneityChecks, cureRecords, sectionStatus] = await Promise.all([
    prisma.processingStep.findMany({ where: { batchRecordId: batchId } }),
    prisma.additionalProcessingStep.findMany({ where: { batchRecordId: batchId }, orderBy: { createdAt: 'asc' } }),
    prisma.homogeneityCheck.findMany({ where: { batchRecordId: batchId } }),
    prisma.cureRecord.findMany({ where: { batchRecordId: batchId } }),
    prisma.sectionCompletionStatus.findUnique({
      where: { batchRecordId_sectionNumber: { batchRecordId: batchId, sectionNumber: 6 } },
      include: { approvedByUser: { select: { fullName: true } } },
    }),
  ])
  const canEdit = canAccessSection(user.role, 6, 'edit')
  const canApprove = canAccessSection(user.role, 6, 'signoff')
  const homogeneityByItem = Object.fromEntries(homogeneityChecks.map((c) => [c.checkItem, c]))
  const existingByStep = Object.fromEntries(steps.map((s) => [s.stepNumber, s]))

  // Prisma's Decimal (CureRecord.phResult) is a class instance, not a plain
  // object — it can't cross the Server -> Client Component boundary as a
  // prop, so convert to string here rather than at display time.
  const serializeCureRecord = (c: (typeof cureRecords)[number] | undefined) =>
    c ? { ...c, phResult: c.phResult?.toString() ?? null } : undefined
  const preCut = serializeCureRecord(cureRecords.find((c) => c.phase === 'PRE_CUT'))
  const postCut = serializeCureRecord(cureRecords.find((c) => c.phase === 'POST_CUT'))

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 6: In-Process Production Record</h1>
        {canApprove && (
          <ApproveSectionControl
            batchRecordId={batchId}
            sectionNumber={6}
            hasEntries={steps.length > 0 || additionalSteps.length > 0}
            approvedByName={sectionStatus?.approvedByUser?.fullName ?? null}
            approvedAt={sectionStatus?.approvedAt ?? null}
          />
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">6.1 — Processing Steps &amp; Observations</h2>
        {canEdit ? (
          <ProcessingStepForm batchRecordId={batchId} existingByStep={existingByStep} />
        ) : (
          <div className="w-full max-w-3xl overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Step</TH>
                  <TH>Time Performed</TH>
                  <TH>Observations / Notes</TH>
                </TR>
              </THead>
              <TBody>
                {Object.values(existingByStep).map((s) => (
                  <TR key={s.stepNumber}>
                    <TD>
                      {s.stepNumber}. {s.stepDescription}
                    </TD>
                    <TD>{s.timePerformed.toISOString().slice(0, 16).replace('T', ' ')}</TD>
                    <TD>{s.observationsNotes || '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            {steps.length === 0 && <p className="mt-2 text-sm text-text-muted">No processing steps recorded yet.</p>}
          </div>
        )}

        <h3 className="text-sm font-semibold text-text">Additional Steps</h3>
        {additionalSteps.length > 0 ? (
          <div className="w-full max-w-3xl overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Step / Direction</TH>
                  <TH>Time Performed</TH>
                  <TH>Observations / Notes</TH>
                </TR>
              </THead>
              <TBody>
                {additionalSteps.map((s) => (
                  <TR key={s.id}>
                    <TD>{s.stepDescription}</TD>
                    <TD>{s.timePerformed.toISOString().slice(0, 16).replace('T', ' ')}</TD>
                    <TD>{s.observationsNotes || '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No additional steps logged.</p>
        )}
        {canEdit && <AdditionalProcessingStepForm batchRecordId={batchId} />}
      </section>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">6.2 — Visual Homogeneity &amp; Consistency Checks</h2>
        {canEdit ? (
          <HomogeneityChecksForm batchRecordId={batchId} existing={homogeneityByItem} />
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-text">
            {Object.entries(homogeneityByItem).map(([key, c]) => (
              <li key={key}>
                {key}: {c.result ?? 'not recorded'}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">6.3 — Cure/Hold Record (Pre-Cut)</h2>
        {canEdit && <CureRecordForm batchRecordId={batchId} phase="PRE_CUT" existing={preCut} />}
      </section>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">6.4 — Cure/Hold Record (Post-Cut)</h2>
        {canEdit && <CureRecordForm batchRecordId={batchId} phase="POST_CUT" existing={postCut} />}
      </section>
    </div>
  )
}
