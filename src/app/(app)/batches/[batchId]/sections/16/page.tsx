import { notFound, redirect } from 'next/navigation'
import { CheckCircle2, Circle } from 'lucide-react'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { signOffCompletenessReview } from '@/server/completenessReview/actions'
import { COMPLETENESS_ITEM_LABELS, COMPLETENESS_ITEM_ORDER } from '@/lib/workflow/completenessLabels'
import { Badge, Button } from '@/components/ui'
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
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
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
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-text">
        {batch.batchNumber} — Section 16: Batch Record Completeness Review
      </h1>

      {signedOff && signoffUser && (
        <p className="text-sm text-success">
          Signed off by {signoffUser.fullName} on{' '}
          {items.find((i) => i.hopSignatureDate)?.hopSignatureDate?.toISOString().slice(0, 10)}
        </p>
      )}

      {canEdit ? (
        <CompletenessReviewForm batchRecordId={batchId} verifiedItems={verifiedItems} naItems={naItems} />
      ) : (
        <ul className="flex max-w-2xl flex-col gap-1 text-sm">
          {COMPLETENESS_ITEM_ORDER.map((key) => (
            <li key={key} className="flex min-h-11 items-center gap-3 px-2 py-1.5 text-text">
              <span className="flex w-10 shrink-0 items-center">
                {verifiedItems.has(key) ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : naItems.has(key) ? (
                  <Badge status="neutral">N/A</Badge>
                ) : (
                  <Circle className="h-4 w-4 text-text-muted" />
                )}
              </span>
              <span>{COMPLETENESS_ITEM_LABELS[key]}</span>
            </li>
          ))}
        </ul>
      )}

      {canSignoff && !signedOff && (
        <form action={signOffCompletenessReview}>
          <input type="hidden" name="batchRecordId" value={batchId} />
          <Button
            type="submit"
            variant="secondary"
            disabled={!allAddressed}
            title={allAddressed ? undefined : 'All items must be verified or marked N/A first'}
          >
            Sign off Section 16 and submit for QC review
          </Button>
        </form>
      )}
    </div>
  )
}
