import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
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
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
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
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 19: Additional Observations &amp; Notes</h1>

      <ul className="flex flex-col gap-3 max-w-2xl">
        {notes.map((n) => (
          <li key={n.id} className="rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            <p className="whitespace-pre-wrap">{n.note}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {n.authorUser.fullName} — {n.createdAt.toISOString().slice(0, 16).replace('T', ' ')}
            </p>
          </li>
        ))}
        {notes.length === 0 && <p className="text-sm text-zinc-500">No notes recorded yet.</p>}
      </ul>

      {canEdit && <BatchNoteForm batchRecordId={batchId} />}
    </div>
  )
}
