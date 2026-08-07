import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import type { Role } from '@/generated/prisma/enums'
import { SignOffForm } from './SignOffForm'

const SIGNOFF_ROLES: { role: Role; label: string }[] = [
  { role: 'PRODUCTION_OPERATOR', label: 'Production Operator' },
  { role: 'HEAD_OF_PRODUCTION', label: 'Head of Production' },
  { role: 'QUALITY_UNIT', label: 'Head of Quality / QC' },
]

export default async function Section18Page({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (!canAccessSection(user.role, 18, 'view')) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">You do not have permission to view this section.</p>
      </div>
    )
  }

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({
    where: { id: batchId },
    include: {
      releaseDecision: true,
      signOffs: { include: { user: true } },
    },
  })
  if (!batch) notFound()

  const readyToSign = batch.status === 'PENDING_QC_REVIEW' && !!batch.releaseDecision?.decision
  const fullyProcessed = batch.signOffs.length === SIGNOFF_ROLES.length

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{batch.batchNumber} — Section 18: Final Sign-Off</h1>
      {!readyToSign && !fullyProcessed && (
        <p className="text-sm text-zinc-500">
          Section 17 must record a release decision before sign-off can begin.
        </p>
      )}

      <ul className="flex flex-col gap-4 max-w-lg">
        {SIGNOFF_ROLES.map(({ role, label }) => {
          const signOff = batch.signOffs.find((s) => s.role === role)
          const canSignThisSlot = readyToSign && !signOff && user.role === role && canAccessSection(user.role, 18, 'signoff')
          return (
            <li key={role} className="flex flex-col gap-1 border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <span className="text-sm font-medium">{label}</span>
              {signOff ? (
                <span className="text-sm text-green-700 dark:text-green-500">
                  Signed by {signOff.user.fullName} on {signOff.signatureDate.toISOString().slice(0, 10)}
                </span>
              ) : canSignThisSlot ? (
                <SignOffForm batchRecordId={batch.id} />
              ) : (
                <span className="text-sm text-zinc-500">Not yet signed</span>
              )}
            </li>
          )
        })}
      </ul>

      {fullyProcessed && (
        <p className="text-sm font-medium">
          Batch {batch.status === 'RELEASED' ? 'released' : batch.status.toLowerCase()}.
        </p>
      )}
    </div>
  )
}
