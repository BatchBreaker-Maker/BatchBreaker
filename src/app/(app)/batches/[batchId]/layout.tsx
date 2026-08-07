import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { IMPLEMENTED_SECTIONS } from '@/lib/workflow/sections'
import { BatchSidebar } from './BatchSidebar'

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
  const accessibleSections = IMPLEMENTED_SECTIONS.filter((n) => canAccessSection(user.role, n, 'view'))

  return (
    <div className="flex flex-1">
      <BatchSidebar batchId={batchId} accessibleSections={accessibleSections} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
