import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { RawMaterialForm } from './RawMaterialForm'

export default async function Section4Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 4, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const entries = await prisma.rawMaterialEntry.findMany({
    where: { batchRecordId: batchId },
    orderBy: { lineNumber: 'asc' },
  })
  const canEdit = canAccessSection(user.role, 4, 'edit')

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 4: Raw Material Log</h1>

      <div className="overflow-x-auto max-w-4xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Trade Name / Description</th>
              <th className="py-2 pr-3">Part Code</th>
              <th className="py-2 pr-3">Supplier</th>
              <th className="py-2 pr-3">Lot #</th>
              <th className="py-2 pr-3">Qty</th>
              <th className="py-2 pr-3">COA</th>
              <th className="py-2 pr-3">Qual. Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2 pr-3">{e.lineNumber}</td>
                <td className="py-2 pr-3">{e.tradeNameDescription}</td>
                <td className="py-2 pr-3">{e.internalPartCode || '—'}</td>
                <td className="py-2 pr-3">{e.supplierName}</td>
                <td className="py-2 pr-3">{e.supplierLotBatchNumber}</td>
                <td className="py-2 pr-3">{e.qtyDispensed.toString()} {e.unit}</td>
                <td className="py-2 pr-3">{e.coaReceived ? 'Y' : 'N'}</td>
                <td className="py-2 pr-3">
                  <span className={e.supplierQualStatus !== 'APPROVED' ? 'font-medium text-amber-700 dark:text-amber-500' : ''}>
                    {e.supplierQualStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="text-sm text-zinc-500">No raw material entries yet.</p>}
      </div>

      {canEdit && <RawMaterialForm batchRecordId={batchId} />}
    </div>
  )
}
