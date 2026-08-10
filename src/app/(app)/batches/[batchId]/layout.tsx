import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { IMPLEMENTED_SECTIONS } from '@/lib/workflow/sections'
import {
  computeBatchProgress,
  sectionDisplayStatus,
  sectionEighteenNeedsInput,
  sectionNeedsInput,
} from '@/lib/workflow/batchProgress'
import { BatchSidebar } from './BatchSidebar'
import { BatchProgressBar } from './BatchProgressBar'
import { SectionNavFooter } from './SectionNavFooter'

export default async function BatchLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ batchId: string }>
}) {
  const user = await verifySession()
  if (!user) redirect('/login')

  const { batchId } = await params
  const batch = await prisma.batchRecord.findUnique({
    where: { id: batchId },
    select: {
      productType: true,
      status: true,
      sectionStatuses: { select: { sectionNumber: true, status: true } },
      releaseDecision: { select: { decision: true } },
      signOffs: { select: { role: true } },
    },
  })
  if (!batch) notFound()

  const statusBySection = new Map(batch.sectionStatuses.map((s) => [s.sectionNumber, s.status]))
  const accessibleSections = IMPLEMENTED_SECTIONS.filter((n) => canAccessSection(user.role, n, 'view'))
  const sectionDisplayStatuses = Object.fromEntries(
    IMPLEMENTED_SECTIONS.map((n) => [n, sectionDisplayStatus(n, user.role, statusBySection.get(n))]),
  )
  const signOffRoles = batch.signOffs.map((s) => s.role)
  const sectionNeedsInputMap = Object.fromEntries(
    IMPLEMENTED_SECTIONS.map((n) => [
      n,
      n === 18
        ? sectionEighteenNeedsInput(user.role, batch.status, !!batch.releaseDecision?.decision, signOffRoles)
        : sectionNeedsInput(n, user.role, batch.productType, batch.status, statusBySection.get(n)),
    ]),
  )
  const progress = computeBatchProgress(batch.productType, batch.sectionStatuses)

  return (
    <div className="flex flex-1 flex-col">
      <BatchProgressBar progress={progress} />
      <div className="flex flex-1 flex-col md:flex-row">
        <BatchSidebar
          batchId={batchId}
          accessibleSections={accessibleSections}
          sectionDisplayStatuses={sectionDisplayStatuses}
          sectionNeedsInput={sectionNeedsInputMap}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          {children}
          <SectionNavFooter batchId={batchId} accessibleSections={accessibleSections} />
        </div>
      </div>
    </div>
  )
}
