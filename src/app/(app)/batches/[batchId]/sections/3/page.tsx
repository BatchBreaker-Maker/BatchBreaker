import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { signOffChecklist } from '@/server/checklist/actions'
import { CHECKLIST_ITEM_LABELS, CHECKLIST_ITEM_ORDER } from '@/lib/workflow/checklistItems'
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
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
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
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 3: Pre-Production Checklist</h1>

      {signedOff && signoffUser && (
        <p className="text-sm text-green-700 dark:text-green-500">
          Signed off by {signoffUser.fullName} on{' '}
          {items.find((i) => i.hopSignoffDate)?.hopSignoffDate?.toISOString().slice(0, 10)}
        </p>
      )}

      {canEdit ? (
        <ChecklistForm batchRecordId={batchId} verifiedItems={verifiedItems} />
      ) : (
        <ul className="flex flex-col gap-2 text-sm max-w-2xl">
          {CHECKLIST_ITEM_ORDER.map((key) => (
            <li key={key} className="flex items-center gap-2">
              <span>{verifiedItems.has(key) ? '✅' : '⬜'}</span>
              <span>{CHECKLIST_ITEM_LABELS[key]}</span>
            </li>
          ))}
        </ul>
      )}

      {canSignoff && !signedOff && (
        <form action={signOffChecklist}>
          <input type="hidden" name="batchRecordId" value={batchId} />
          <button
            type="submit"
            disabled={!allVerified}
            className="rounded border px-4 py-2 text-sm font-medium disabled:opacity-50"
            title={allVerified ? undefined : 'All items must be verified first'}
          >
            Sign off Section 3 as Head of Production
          </button>
        </form>
      )}
    </div>
  )
}
