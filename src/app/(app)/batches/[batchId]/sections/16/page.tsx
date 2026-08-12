import { notFound, redirect } from 'next/navigation'
import { CheckCircle2, Circle } from 'lucide-react'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { COMPLETENESS_ITEM_LABELS, COMPLETENESS_ITEM_ORDER } from '@/lib/workflow/completenessLabels'
import { BAR_SOAP_ONLY_SECTIONS } from '@/lib/workflow/batchProgress'
import { SECTION_TITLES } from '@/lib/workflow/sections'
import { Badge } from '@/components/ui'
import { CompletenessReviewForm } from './CompletenessReviewForm'
import { SignOffButton } from './SignOffButton'

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

  const [items, barSoapSectionStatuses] = await Promise.all([
    prisma.completenessReviewItem.findMany({
      where: { batchRecordId: batchId },
      include: { hopSignatureUser: true },
    }),
    batch.productType === 'BAR_SOAP'
      ? prisma.sectionCompletionStatus.findMany({
          where: { batchRecordId: batchId, sectionNumber: { in: Array.from(BAR_SOAP_ONLY_SECTIONS) } },
        })
      : Promise.resolve([]),
  ])
  const incompleteBarSoapSections =
    batch.productType === 'BAR_SOAP'
      ? Array.from(BAR_SOAP_ONLY_SECTIONS).filter((n) => {
          const status = barSoapSectionStatuses.find((s) => s.sectionNumber === n)?.status
          return status !== 'COMPLETE' && status !== 'APPROVED'
        })
      : []
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
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
        <ul className="mx-auto flex w-full max-w-2xl flex-col gap-1 text-sm">
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

      {canSignoff && !signedOff && incompleteBarSoapSections.length > 0 && (
        <p className="text-sm text-warning">
          This is a bar soap batch —{' '}
          {incompleteBarSoapSections.map((n, i) => (
            <span key={n}>
              {i > 0 && ' and '}
              Section {n} ({SECTION_TITLES[n]})
            </span>
          ))}{' '}
          must be completed before sign-off.
        </p>
      )}

      {canSignoff && !signedOff && (
        <SignOffButton
          batchRecordId={batchId}
          allAddressed={allAddressed && incompleteBarSoapSections.length === 0}
          disabledReason={
            incompleteBarSoapSections.length > 0
              ? `Section${incompleteBarSoapSections.length > 1 ? 's' : ''} ${incompleteBarSoapSections.join(', ')} must be completed first (bar soap batch)`
              : undefined
          }
        />
      )}
    </div>
  )
}
