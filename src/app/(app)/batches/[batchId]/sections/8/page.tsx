import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { ApproveSectionControl } from '@/components/workflow/ApproveSectionControl'
import { StampingSetupForm } from './StampingSetupForm'
import { PressRunForm } from './PressRunForm'
import { PressRunLogTable } from './PressRunLogTable'

export default async function Section8Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 8, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const [setup, runs, sectionStatus] = await Promise.all([
    prisma.stampingSetup.findUnique({ where: { batchRecordId: batchId } }),
    prisma.pressRun.findMany({
      where: { batchRecordId: batchId },
      orderBy: { dateTime: 'asc' },
      include: { correctedByEntries: { select: { id: true } } },
    }),
    prisma.sectionCompletionStatus.findUnique({
      where: { batchRecordId_sectionNumber: { batchRecordId: batchId, sectionNumber: 8 } },
      include: { approvedByUser: { select: { fullName: true } } },
    }),
  ])
  const canEdit = canAccessSection(user.role, 8, 'edit')
  const canApprove = canAccessSection(user.role, 8, 'signoff')

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 8: Bar Stamping / Press Operations</h1>
        {canApprove && (
          <ApproveSectionControl
            batchRecordId={batchId}
            sectionNumber={8}
            hasEntries={runs.length > 0}
            approvedByName={sectionStatus?.approvedByUser?.fullName ?? null}
            approvedAt={sectionStatus?.approvedAt ?? null}
          />
        )}
      </div>

      <section className="mx-auto flex w-full max-w-2xl flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">8.1 — Press Setup Verification</h2>
        {canEdit && <StampingSetupForm batchRecordId={batchId} existing={setup} />}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">8.2 — Stamping / Press Log</h2>
        <PressRunLogTable runs={runs} batchRecordId={batchId} canCorrect={canEdit} />
        {canEdit && <PressRunForm batchRecordId={batchId} />}
      </section>
    </div>
  )
}
