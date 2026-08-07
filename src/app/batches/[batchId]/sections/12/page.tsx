import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { RetainedSampleForm } from './RetainedSampleForm'
import { authorizeSampleDestruction } from '@/server/retainedSample/actions'

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
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const record = await prisma.retainedSampleRecord.findUnique({ where: { batchRecordId: batchId } })
  const canEdit = canAccessSection(user.role, 12, 'edit')

  return (
    <div className="flex flex-col gap-8 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 12: Retained Sample</h1>

      <section className="flex flex-col gap-3 max-w-lg">
        {canEdit ? (
          <RetainedSampleForm batchRecordId={batchId} existing={record} />
        ) : (
          <p className="text-sm text-zinc-500">No retained sample record yet.</p>
        )}
      </section>

      {record && (
        <section className="flex flex-col gap-3 max-w-lg border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="font-medium">Sample Destruction</h2>
          {record.destructionDate ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Destruction authorized on {record.destructionDate.toISOString().slice(0, 10)}.
            </p>
          ) : (
            <>
              <p className="text-sm text-zinc-500">
                Scheduled review/destruction date: {record.scheduledDestructionReviewDate.toISOString().slice(0, 10)}.
              </p>
              {canEdit && (
                <form action={authorizeSampleDestruction}>
                  <input type="hidden" name="batchRecordId" value={batchId} />
                  <button
                    type="submit"
                    className="self-start rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    Authorize destruction
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}
