import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { PostProductionCloseoutForm } from './PostProductionCloseoutForm'

export default async function Section15Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 15, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const closeout = await prisma.postProductionCloseout.findUnique({ where: { batchRecordId: batchId } })
  const canEdit = canAccessSection(user.role, 15, 'edit')

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-text">
        {batch.batchNumber} — Section 15: Bulk Product Storage &amp; Post-Production Closeout
      </h1>

      <section className="flex flex-col gap-3">
        {canEdit ? (
          <PostProductionCloseoutForm batchRecordId={batchId} existing={closeout} />
        ) : (
          <p className="text-sm text-text-muted">No edit access for this section.</p>
        )}
      </section>
    </div>
  )
}
