import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { TemperatureForm } from './TemperatureForm'

export default async function Section5Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 5, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({ where: { id: batchId } })
  if (!batch) notFound()

  const entries = await prisma.temperatureEntry.findMany({
    where: { batchRecordId: batchId },
    orderBy: { lineNumber: 'asc' },
  })
  const canEdit = canAccessSection(user.role, 5, 'edit')

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 5: Raw Material Temperatures</h1>

      <div className="overflow-x-auto max-w-3xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Material</th>
              <th className="py-2 pr-3">Acceptable Range</th>
              <th className="py-2 pr-3">Actual</th>
              <th className="py-2 pr-3">Within Range?</th>
              <th className="py-2 pr-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2 pr-3">{e.lineNumber}</td>
                <td className="py-2 pr-3">{e.materialIngredient}</td>
                <td className="py-2 pr-3">{e.acceptableTempMinF.toString()}–{e.acceptableTempMaxF.toString()}°F</td>
                <td className="py-2 pr-3">{e.actualTempF.toString()}°F</td>
                <td className="py-2 pr-3">
                  <span className={!e.withinRange ? 'font-medium text-red-600' : ''}>
                    {e.withinRange ? 'Yes' : 'OUT OF RANGE'}
                  </span>
                </td>
                <td className="py-2 pr-3">{e.timeOfAddition.toISOString().slice(0, 16).replace('T', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="text-sm text-zinc-500">No temperature entries yet.</p>}
      </div>

      {canEdit && <TemperatureForm batchRecordId={batchId} />}
    </div>
  )
}
