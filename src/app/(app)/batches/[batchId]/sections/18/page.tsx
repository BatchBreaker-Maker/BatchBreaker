import { notFound, redirect } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import type { Role } from '@/generated/prisma/enums'
import { Card, CardTitle } from '@/components/ui'
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
        <p className="text-sm text-danger">You do not have permission to view this section.</p>
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
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-text">{batch.batchNumber} — Section 18: Final Sign-Off</h1>
      {!readyToSign && !fullyProcessed && (
        <p className="text-sm text-text-muted">Section 17 must record a release decision before sign-off can begin.</p>
      )}

      <ul className="flex max-w-lg flex-col gap-3">
        {SIGNOFF_ROLES.map(({ role, label }) => {
          const signOff = batch.signOffs.find((s) => s.role === role)
          const canSignThisSlot = readyToSign && !signOff && user.role === role && canAccessSection(user.role, 18, 'signoff')
          return (
            <li key={role}>
              <Card>
                <CardTitle>{label}</CardTitle>
                {signOff ? (
                  <p className="mt-2 flex items-center gap-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Signed by {signOff.user.fullName} on {signOff.signatureDate.toISOString().slice(0, 10)}
                  </p>
                ) : canSignThisSlot ? (
                  <div className="mt-2">
                    <SignOffForm batchRecordId={batch.id} />
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-text-muted">Not yet signed</p>
                )}
              </Card>
            </li>
          )
        })}
      </ul>

      {fullyProcessed && (
        <p className="text-sm font-medium text-text">
          Batch {batch.status === 'RELEASED' ? 'released' : batch.status.toLowerCase()}.
        </p>
      )}
    </div>
  )
}
