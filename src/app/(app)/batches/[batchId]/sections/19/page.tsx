import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { Card } from '@/components/ui'
import { BatchNoteForm } from './BatchNoteForm'

export default async function Section19Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 19, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const notes = await prisma.batchNote.findMany({
    where: { batchRecordId: batchId },
    orderBy: { createdAt: 'asc' },
    include: { authorUser: true },
  })
  const canEdit = canAccessSection(user.role, 19, 'edit')

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 19: Additional Observations &amp; Notes</h1>

      <ul className="flex max-w-2xl flex-col gap-3">
        {notes.map((n) => (
          <li key={n.id}>
            <Card>
              <p className="text-sm whitespace-pre-wrap text-text">{n.note}</p>
              <p className="mt-1 text-xs text-text-muted">
                {n.authorUser.fullName} — {n.createdAt.toISOString().slice(0, 16).replace('T', ' ')}
              </p>
            </Card>
          </li>
        ))}
        {notes.length === 0 && <p className="text-sm text-text-muted">No notes recorded yet.</p>}
      </ul>

      {canEdit && <BatchNoteForm batchRecordId={batchId} />}
    </div>
  )
}
