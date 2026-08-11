import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { RetainedSampleForm } from './RetainedSampleForm'
import { authorizeSampleDestruction } from '@/server/retainedSample/actions'
import { Button, Card, CardTitle } from '@/components/ui'

export default async function Section12Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 12, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const record = await prisma.retainedSampleRecord.findUnique({ where: { batchRecordId: batchId } })
  const canEdit = canAccessSection(user.role, 12, 'edit')

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 12: Retained Sample</h1>

      <section className="mx-auto flex w-full max-w-xl flex-col gap-3">
        {canEdit ? (
          <RetainedSampleForm batchRecordId={batchId} existing={record} />
        ) : (
          <p className="text-sm text-text-muted">No retained sample record yet.</p>
        )}
      </section>

      {record && (
        <Card
          className={
            record.destructionDate
              ? 'mx-auto w-full max-w-xl'
              : 'mx-auto w-full max-w-xl border-warning/30 bg-warning/5'
          }
        >
          <CardTitle className={record.destructionDate ? undefined : 'text-warning'}>Sample Destruction</CardTitle>
          {record.destructionDate ? (
            <p className="mt-2 text-sm text-text-muted">
              Destruction authorized on {record.destructionDate.toISOString().slice(0, 10)}.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-text-muted">
                Scheduled review/destruction date: {record.scheduledDestructionReviewDate.toISOString().slice(0, 10)}.
              </p>
              {canEdit && (
                <form action={authorizeSampleDestruction} className="mt-3">
                  <input type="hidden" name="batchRecordId" value={batchId} />
                  <Button type="submit" variant="destructive">
                    Authorize destruction
                  </Button>
                </form>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  )
}
