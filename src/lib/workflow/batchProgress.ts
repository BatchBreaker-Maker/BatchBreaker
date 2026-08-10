import type { BatchStatus, ProductType, Role, SectionStatus } from '@/generated/prisma/enums'
import { getSectionAccess, SECTION_ACCESS } from '@/lib/auth/permissionMatrix'
import { IMPLEMENTED_SECTIONS } from './sections'

export type SectionDisplayStatus = 'success' | 'warning' | 'danger' | 'neutral'

// Sections excluded from the batch completion percentage entirely (Phase 4
// plan, per the user's own examples of what's conditional/optional). 14
// (Deviations & Incidents) was named explicitly; 19 (freeform notes) and 20
// (system-generated change history) have no field-driven "complete" state to
// reach at all, so counting them would just cap every batch below 100%.
const ALWAYS_EXCLUDED_SECTIONS = new Set([14, 19, 20])

// Cutting/stamping only apply to bar soap — a liquid or "other" batch
// shouldn't be penalized for having nothing to record there.
const BAR_SOAP_ONLY_SECTIONS = new Set([7, 8])

export function isSectionRequiredForBatch(sectionNumber: number, productType: ProductType): boolean {
  if (ALWAYS_EXCLUDED_SECTIONS.has(sectionNumber)) return false
  if (BAR_SOAP_ONLY_SECTIONS.has(sectionNumber) && productType !== 'BAR_SOAP') return false
  return true
}

// Grey ("no access") outranks the real status — a role that can't see a
// section at all shouldn't read it as "not started" (which would look like
// a real gap in the record rather than a permissions boundary).
export function sectionDisplayStatus(
  sectionNumber: number,
  role: Role,
  status: SectionStatus | undefined,
): SectionDisplayStatus {
  if (getSectionAccess(role, sectionNumber) === 'none') return 'neutral'
  switch (status ?? 'NOT_STARTED') {
    case 'NOT_STARTED':
      return 'danger'
    case 'IN_PROGRESS':
      return 'warning'
    case 'COMPLETE':
    case 'APPROVED':
      return 'success'
  }
}

// Sections excluded from the generic "needs your input" indicator below.
// 19 (freeform notes) has no real "done" state — once any note exists its
// status sticks at IN_PROGRESS forever, so treating that as an outstanding
// task would flag it permanently for every role with edit access. 18 (Final
// Sign-Off) never writes SectionCompletionStatus at all — it tracks
// per-role completion through the separate SignOff table instead — so it's
// handled by the dedicated sectionEighteenNeedsInput below. 20 needs no
// special case: no MatrixRole ever holds edit/signoff there, so it's
// excluded automatically by the access check below.
const NEEDS_INPUT_EXCLUDED_SECTIONS = new Set([18, 19])

// Once a batch reaches one of these, the record is closed — open-ended log
// sections (4-9) can sit at IN_PROGRESS forever if nobody ever ran the
// sign-off action, but a released/rejected/quarantined batch shouldn't keep
// prompting anyone to act on it regardless of that dangling status.
const TERMINAL_BATCH_STATUSES = new Set<BatchStatus>(['RELEASED', 'REJECTED', 'QUARANTINED'])

function sectionAppliesToBatch(sectionNumber: number, productType: ProductType): boolean {
  if (NEEDS_INPUT_EXCLUDED_SECTIONS.has(sectionNumber)) return false
  if (BAR_SOAP_ONLY_SECTIONS.has(sectionNumber) && productType !== 'BAR_SOAP') return false
  return true
}

// Most sections split the work in two: some role has 'edit' to fill fields
// in, then a different role has 'signoff' to review it. But a few sections
// (16, 17) give exactly one role 'signoff' and nobody else 'edit' — that
// role IS the direct filler, not a reviewer of someone else's work, so
// NOT_STARTED should flag for them too, not just IN_PROGRESS/COMPLETE.
function sectionHasDistinctEditor(sectionNumber: number): boolean {
  const row = SECTION_ACCESS[sectionNumber]
  if (!row) return false
  return Object.values(row).some((level) => level === 'edit')
}

// A section "needs input" from a role when that role is the one positioned
// to move it forward right now: an 'edit' role has fields left to fill in
// (NOT_STARTED/IN_PROGRESS), or a 'signoff' role has something ready to
// review/approve that it hasn't approved yet (IN_PROGRESS/COMPLETE, plus
// NOT_STARTED when there's no separate 'edit' role — see
// sectionHasDistinctEditor above).
export function sectionNeedsInput(
  sectionNumber: number,
  role: Role,
  productType: ProductType,
  batchStatus: BatchStatus,
  status: SectionStatus | undefined,
): boolean {
  if (TERMINAL_BATCH_STATUSES.has(batchStatus)) return false
  if (!sectionAppliesToBatch(sectionNumber, productType)) return false
  const currentStatus = status ?? 'NOT_STARTED'
  switch (getSectionAccess(role, sectionNumber)) {
    case 'edit':
      return currentStatus === 'NOT_STARTED' || currentStatus === 'IN_PROGRESS'
    case 'signoff':
      if (!sectionHasDistinctEditor(sectionNumber) && currentStatus === 'NOT_STARTED') return true
      return currentStatus === 'IN_PROGRESS' || currentStatus === 'COMPLETE'
    default:
      return false
  }
}

// Section 18 (Final Sign-Off) never writes SectionCompletionStatus — each
// of the three roles signs independently once section 17 has recorded a
// release decision, tracked via the separate SignOff table (mirrors the
// readiness check in sections/18/page.tsx).
export function sectionEighteenNeedsInput(
  role: Role,
  batchStatus: BatchStatus,
  hasReleaseDecision: boolean,
  signOffRoles: Role[],
): boolean {
  if (getSectionAccess(role, 18) !== 'signoff') return false
  if (batchStatus !== 'PENDING_QC_REVIEW' || !hasReleaseDecision) return false
  return !signOffRoles.includes(role)
}

export function batchNeedsInput(
  role: Role,
  productType: ProductType,
  batchStatus: BatchStatus,
  sectionStatuses: { sectionNumber: number; status: SectionStatus }[],
  hasReleaseDecision: boolean,
  signOffRoles: Role[],
): boolean {
  if (TERMINAL_BATCH_STATUSES.has(batchStatus)) return false
  const statusBySection = new Map(sectionStatuses.map((s) => [s.sectionNumber, s.status]))
  return (
    IMPLEMENTED_SECTIONS.some((n) => sectionNeedsInput(n, role, productType, batchStatus, statusBySection.get(n))) ||
    sectionEighteenNeedsInput(role, batchStatus, hasReleaseDecision, signOffRoles)
  )
}

export interface BatchProgress {
  percent: number
  completedCount: number
  totalCount: number
}

export function computeBatchProgress(
  productType: ProductType,
  sectionStatuses: { sectionNumber: number; status: SectionStatus }[],
): BatchProgress {
  const statusBySection = new Map(sectionStatuses.map((s) => [s.sectionNumber, s.status]))
  const requiredSections = IMPLEMENTED_SECTIONS.filter((n) => isSectionRequiredForBatch(n, productType))

  const completedCount = requiredSections.filter((n) => {
    const status = statusBySection.get(n) ?? 'NOT_STARTED'
    return status === 'COMPLETE' || status === 'APPROVED'
  }).length

  const totalCount = requiredSections.length
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  return { percent, completedCount, totalCount }
}
