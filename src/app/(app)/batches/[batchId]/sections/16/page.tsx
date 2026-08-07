import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { signOffCompletenessReview } from '@/server/completenessReview/actions'
import { COMPLETENESS_ITEM_LABELS, COMPLETENESS_ITEM_ORDER } from '@/lib/workflow/completenessLabels'
import { CompletenessReviewForm } from './CompletenessReviewForm'

export default async function Section16Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 16, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const items = await prisma.completenessReviewItem.findMany({
    where: { batchRecordId: batchId },
    include: { hopSignatureUser: true },
  })
  const verifiedItems = new Set(items.filter((i) => i.verified).map((i) => i.itemKey))
  const naItems = new Set(items.filter((i) => i.notApplicable).map((i) => i.itemKey))
  const allAddressed =
    verifiedItems.size + naItems.size === COMPLETENESS_ITEM_ORDER.length &&
    COMPLETENESS_ITEM_ORDER.every((k) => verifiedItems.has(k) || naItems.has(k))
  const signedOff = items.some((i) => i.hopSignatureUserId)
  const signoffUser = items.find((i) => i.hopSignatureUser)?.hopSignatureUser

  const canEdit = canAccessSection(user.role, 16, 'signoff') && !signedOff
  const canSignoff = canAccessSection(user.role, 16, 'signoff')

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 16: Batch Record Completeness Review</h1>

      {signedOff && signoffUser && (
        <p className="text-sm text-green-700 dark:text-green-500">
          Signed off by {signoffUser.fullName} on{' '}
          {items.find((i) => i.hopSignatureDate)?.hopSignatureDate?.toISOString().slice(0, 10)}
        </p>
      )}

      {canEdit ? (
        <CompletenessReviewForm batchRecordId={batchId} verifiedItems={verifiedItems} naItems={naItems} />
      ) : (
        <ul className="flex flex-col gap-2 text-sm max-w-2xl">
          {COMPLETENESS_ITEM_ORDER.map((key) => (
            <li key={key} className="flex items-center gap-2">
              <span>{verifiedItems.has(key) ? '✅' : naItems.has(key) ? 'N/A' : '⬜'}</span>
              <span>{COMPLETENESS_ITEM_LABELS[key]}</span>
            </li>
          ))}
        </ul>
      )}

      {canSignoff && !signedOff && (
        <form action={signOffCompletenessReview}>
          <input type="hidden" name="batchRecordId" value={batchId} />
          <button
            type="submit"
            disabled={!allAddressed}
            className="rounded border px-4 py-2 text-sm font-medium disabled:opacity-50"
            title={allAddressed ? undefined : 'All items must be verified or marked N/A first'}
          >
            Sign off Section 16 and submit for QC review
          </button>
        </form>
      )}
    </div>
  )
}
