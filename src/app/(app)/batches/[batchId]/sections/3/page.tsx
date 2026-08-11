import { notFound, redirect } from 'next/navigation'
import { CheckCircle2, Circle } from 'lucide-react'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { signOffChecklist } from '@/server/checklist/actions'
import { CHECKLIST_ITEM_LABELS, CHECKLIST_ITEM_ORDER } from '@/lib/workflow/checklistItems'
import { Button } from '@/components/ui'
import { ChecklistForm } from './ChecklistForm'

export default async function Section3Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 3, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const items = await prisma.preProductionChecklistItem.findMany({
    where: { batchRecordId: batchId },
    include: { hopSignoffUser: true },
  })
  const verifiedItems = new Set(items.filter((i) => i.verified).map((i) => i.itemKey))
  const allVerified = verifiedItems.size === CHECKLIST_ITEM_ORDER.length
  const signedOff = items.some((i) => i.hopSignoffUserId)
  const signoffUser = items.find((i) => i.hopSignoffUser)?.hopSignoffUser

  const canEdit = canAccessSection(user.role, 3, 'edit') && !signedOff
  const canSignoff = canAccessSection(user.role, 3, 'signoff')

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 3: Pre-Production Checklist</h1>

      {signedOff && signoffUser && (
        <p className="text-sm text-success">
          Signed off by {signoffUser.fullName} on{' '}
          {items.find((i) => i.hopSignoffDate)?.hopSignoffDate?.toISOString().slice(0, 10)}
        </p>
      )}

      {canEdit ? (
        <ChecklistForm batchRecordId={batchId} verifiedItems={verifiedItems} />
      ) : (
        <ul className="mx-auto flex w-full max-w-2xl flex-col gap-1 text-sm">
          {CHECKLIST_ITEM_ORDER.map((key) => (
            <li key={key} className="flex items-center gap-3 px-2 py-1.5 text-text">
              {verifiedItems.has(key) ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-text-muted" />
              )}
              <span>{CHECKLIST_ITEM_LABELS[key]}</span>
            </li>
          ))}
        </ul>
      )}

      {canSignoff && !signedOff && (
        <form action={signOffChecklist}>
          <input type="hidden" name="batchRecordId" value={batchId} />
          <Button
            type="submit"
            variant="secondary"
            disabled={!allVerified}
            title={allVerified ? undefined : 'All items must be verified first'}
          >
            Sign off Section 3 as Head of Production
          </Button>
        </form>
      )}
    </div>
  )
}
