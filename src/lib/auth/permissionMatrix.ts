import type { Role } from '@/generated/prisma/enums'

export type AccessLevel = 'none' | 'view' | 'edit' | 'signoff'

type MatrixRole = Exclude<Role, 'SYSTEM_ADMINISTRATOR'>

/**
 * Section-level access matrix from spec §2.2. One row per batch record
 * section; SYSTEM_ADMINISTRATOR is intentionally absent (see getSectionAccess).
 *
 * Spec note: the §2.2 table cells for Sections 16 and 17 show Production
 * Operator as "View", but the "Key rules" immediately below the same table
 * state "Production Operators cannot access Sections 16, 17, or 20" at all.
 * Resolved here in favor of the stricter prose rule (principle of least
 * privilege for a compliance system) — PRODUCTION_OPERATOR is 'none' on
 * 16/17/20. Flag to the spec owner if the looser table reading was intended.
 */
// QUALITY_UNIT was split (2026-08-11) into HEAD_OF_QC and QC_USER.
// QC_USER: Section 14 signoff, Section 18 signoff (QC co-signature),
// Section 19 edit, view everywhere else — i.e. everything the old
// QUALITY_UNIT role had except Section 17.
// HEAD_OF_QC: everything QC_USER has, plus Section 17 signoff — the sole
// role that can record the batch release decision (RELEASED / REJECTED /
// QUARANTINED), gated on Section 14 having no open deviations. HEAD_OF_QC is
// a strict superset of QC_USER throughout this table.
export const SECTION_ACCESS: Record<number, Record<MatrixRole, AccessLevel>> = {
  1: { PRODUCTION_OPERATOR: 'view', HEAD_OF_PRODUCTION: 'edit', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  2: { PRODUCTION_OPERATOR: 'view', HEAD_OF_PRODUCTION: 'edit', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  3: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  4: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  // Sections 5,6,7,8,9,12,13: spec §2.2 gives HoP plain "View" here, but the
  // user asked (2026-08-07 UI/UX pass) that HoP have every capability a
  // Production Operator has "in addition to other functions... since HoP is
  // often the main operator" — bumped to at least 'edit' to match Operator's
  // level.
  // Sections 4-9 are open-ended logs with no natural "complete" state (see
  // Phase 4 plan's approval/correction mechanism) — HoP additionally gets
  // 'signoff' on 5,6,7,8,9 so they can approve the log once it's accurate,
  // matching section 4's HoP='signoff' which was already set up for exactly
  // this but never wired to an action until Phase 4.
  5: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  6: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  7: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  8: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  9: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  10: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  11: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  12: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'edit', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  13: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'edit', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  // Spec §2.2 lists QC's cell as "View / Review" (vs. plain "View" elsewhere)
  // and §3.6 requires open deviations be "explicitly cleared by QC with
  // documented rationale" — same compound-cell pattern as Sections 4/10/11's
  // "Verify/Co-sign"/"Approve"/"Verify", which this matrix maps to 'signoff'.
  // Both QC roles get 'signoff' here so resolveDeviation can gate on either.
  // HoP bumped to 'edit' here too (see note above sections 5-13) — QC's
  // 'signoff' is unrelated and stays as-is.
  14: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'edit', HEAD_OF_QC: 'signoff', QC_USER: 'signoff', MANAGEMENT_COMPLIANCE: 'view' },
  15: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  16: { PRODUCTION_OPERATOR: 'none', HEAD_OF_PRODUCTION: 'signoff', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  // Only HEAD_OF_QC can record the release decision — QC_USER is view-only
  // here (2026-08-11 role split).
  17: { PRODUCTION_OPERATOR: 'none', HEAD_OF_PRODUCTION: 'view', HEAD_OF_QC: 'signoff', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  18: { PRODUCTION_OPERATOR: 'signoff', HEAD_OF_PRODUCTION: 'signoff', HEAD_OF_QC: 'signoff', QC_USER: 'signoff', MANAGEMENT_COMPLIANCE: 'view' },
  19: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'edit', HEAD_OF_QC: 'edit', QC_USER: 'edit', MANAGEMENT_COMPLIANCE: 'view' },
  20: { PRODUCTION_OPERATOR: 'none', HEAD_OF_PRODUCTION: 'view', HEAD_OF_QC: 'view', QC_USER: 'view', MANAGEMENT_COMPLIANCE: 'view' },
}

const LEVEL_RANK: Record<AccessLevel, number> = { none: 0, view: 1, edit: 2, signoff: 3 }

export function getSectionAccess(role: Role, section: number): AccessLevel {
  // Spec §2.2's "System Administrator cannot edit batch record data" was
  // superseded by explicit user direction (2026-08-07 UI/UX pass): "Admin
  // account should have access to everything and the ability to edit/adjust
  // things as needed." Admin gets top-rank access to every section as a
  // result — the one stated exception, batch number, needs no special-case
  // here since no role (including admin) has any edit path for it at all.
  if (role === 'SYSTEM_ADMINISTRATOR') return 'signoff'
  const row = SECTION_ACCESS[section]
  if (!row) return 'none'
  return row[role]
}

/**
 * The single check every Server Action and data-loading function must call.
 * Render-time hiding is a UX convenience only — this is the real gate
 * (spec §7.1: "access rules must be enforced at the API level").
 */
export function canAccessSection(
  role: Role,
  section: number,
  required: 'view' | 'edit' | 'signoff',
): boolean {
  return LEVEL_RANK[getSectionAccess(role, section)] >= LEVEL_RANK[required]
}

export class SectionAccessError extends Error {
  constructor(section: number, required: string) {
    super(`Not authorized for section ${section} (requires ${required})`)
    this.name = 'SectionAccessError'
  }
}

export function requireSectionAccess(
  role: Role,
  section: number,
  required: 'view' | 'edit' | 'signoff',
): void {
  if (!canAccessSection(role, section, required)) {
    throw new SectionAccessError(section, required)
  }
}

// Deleting a Section 6.1 additional-step entry is a narrower, bespoke
// capability that doesn't fit the section-level view/edit/signoff matrix
// above — it grants MANAGEMENT_COMPLIANCE (normally view-only on section 6)
// delete rights while excluding PRODUCTION_OPERATOR and QC_USER (who
// otherwise have edit/view access there), per explicit user direction
// (2026-08-11). Kept here alongside the other role-based authorization
// helpers rather than folded into SECTION_ACCESS.
const ADDITIONAL_PROCESSING_STEP_DELETE_ROLES: Role[] = [
  'HEAD_OF_PRODUCTION',
  'HEAD_OF_QC',
  'SYSTEM_ADMINISTRATOR',
  'MANAGEMENT_COMPLIANCE',
]

export function canDeleteAdditionalProcessingStep(role: Role): boolean {
  return ADDITIONAL_PROCESSING_STEP_DELETE_ROLES.includes(role)
}
