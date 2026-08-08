import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { NewBatchForm } from './NewBatchForm'

export default async function NewBatchPage() {
  const user = await verifySession()
  if (!user) redirect('/login')

  if (!canAccessSection(user.role, 1, 'edit')) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">
          You do not have permission to create a batch record.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-semibold text-text">New Batch Record — Section 1: Batch Identification</h1>
        <p className="text-sm text-text-muted">
          The record retention deadline is calculated automatically from the production date.
        </p>
      </div>
      <NewBatchForm />
    </div>
  )
}
