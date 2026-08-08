import { approveOpenEndedSection } from '@/server/workflow/actions'
import { Button } from '@/components/ui'

// A plain form bound directly to a void Server Action — no client state
// needed, matching the rest of the app's non-interactive-confirmation
// actions (e.g. admin's toggleUserActive).
export function ApproveSectionControl({
  batchRecordId,
  sectionNumber,
  hasEntries,
  approvedByName,
  approvedAt,
}: {
  batchRecordId: string
  sectionNumber: number
  hasEntries: boolean
  approvedByName: string | null
  approvedAt: Date | null
}) {
  if (approvedByName && approvedAt) {
    return (
      <p className="text-xs text-success">
        Approved by {approvedByName} on {approvedAt.toISOString().slice(0, 16).replace('T', ' ')}
      </p>
    )
  }
  return (
    <form action={approveOpenEndedSection}>
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <input type="hidden" name="sectionNumber" value={sectionNumber} />
      <Button
        type="submit"
        variant="secondary"
        disabled={!hasEntries}
        title={hasEntries ? undefined : 'Add at least one entry before approving'}
      >
        Approve section
      </Button>
    </form>
  )
}
