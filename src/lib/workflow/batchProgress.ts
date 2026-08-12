import type { BatchStatus, ProductType, Role, SectionStatus, SignOffRole } from '@/generated/prisma/enums'
import { getSectionAccess, SECTION_ACCESS } from '@/lib/auth/permissionMatrix'
import { IMPLEMENTED_SECTIONS } from './sections'
import { userSignOffRole } from './signOffRoles'

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
  signOffRoles: SignOffRole[],
): boolean {
  if (getSectionAccess(role, 18) !== 'signoff') return false
  if (batchStatus !== 'PENDING_QC_REVIEW' || !hasReleaseDecision) return false
  // HEAD_OF_QC and QC_USER share a single "QC" sign-off slot — map the
  // viewer's literal role to that slot before checking who's already signed.
  const slot = userSignOffRole(role)
  return slot != null && !signOffRoles.includes(slot)
}

// Section 18's three sign-off slots map to a representative literal Role for
// checking SECTION_ACCESS — PRODUCTION_OPERATOR and HEAD_OF_PRODUCTION map
// 1:1, but "QC" is shared by HEAD_OF_QC and QC_USER, so HEAD_OF_QC (the
// strict superset per permissionMatrix's own comment) stands in for the slot
// to pick up HEAD_OF_QC-only responsibilities like Section 17.
const SIGN_OFF_SLOT_REPRESENTATIVE_ROLE: Record<SignOffRole, Role> = {
  PRODUCTION_OPERATOR: 'PRODUCTION_OPERATOR',
  HEAD_OF_PRODUCTION: 'HEAD_OF_PRODUCTION',
  QC: 'HEAD_OF_QC',
}

// Section 14 is deliberately excluded here even though it has real
// edit/signoff rows: its SectionCompletionStatus caps at COMPLETE and never
// reaches APPROVED, so sectionNeedsInput would flag it as outstanding for
// HEAD_OF_QC forever, even with zero open deviations. The real blocking
// condition (open deviations) is enforced separately in saveReleaseDecision
// and should be surfaced by the caller using the actual open-deviation
// count, not this generic per-section check. 18 is the section being
// computed for; 19/20 never reach a real "done" state (see
// NEEDS_INPUT_EXCLUDED_SECTIONS above).
const SIGN_OFF_CHECKLIST_EXCLUDED_SECTIONS = new Set([14, 18, 19, 20])

// Powers the "waiting on" checklist shown per sign-off slot in Section 18 —
// reuses the exact same sectionNeedsInput definition that already drives the
// sidebar/dashboard "Input Needed" flags, so the two stay consistent by
// construction rather than by two separately-maintained rules.
export function outstandingSectionsForSignOffSlot(
  slot: SignOffRole,
  productType: ProductType,
  batchStatus: BatchStatus,
  sectionStatuses: { sectionNumber: number; status: SectionStatus }[],
): number[] {
  const role = SIGN_OFF_SLOT_REPRESENTATIVE_ROLE[slot]
  const statusBySection = new Map(sectionStatuses.map((s) => [s.sectionNumber, s.status]))
  return IMPLEMENTED_SECTIONS.filter(
    (n) =>
      !SIGN_OFF_CHECKLIST_EXCLUDED_SECTIONS.has(n) &&
      sectionNeedsInput(n, role, productType, batchStatus, statusBySection.get(n)),
  )
}

export function batchNeedsInput(
  role: Role,
  productType: ProductType,
  batchStatus: BatchStatus,
  sectionStatuses: { sectionNumber: number; status: SectionStatus }[],
  hasReleaseDecision: boolean,
  signOffRoles: SignOffRole[],
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
