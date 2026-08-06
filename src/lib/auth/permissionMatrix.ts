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
export const SECTION_ACCESS: Record<number, Record<MatrixRole, AccessLevel>> = {
  1: { PRODUCTION_OPERATOR: 'view', HEAD_OF_PRODUCTION: 'edit', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  2: { PRODUCTION_OPERATOR: 'view', HEAD_OF_PRODUCTION: 'edit', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  3: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  4: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  5: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'view', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  6: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'view', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  7: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'view', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  8: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'view', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  9: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'view', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  10: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  11: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  12: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'view', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  13: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'view', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  14: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'view', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  15: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'signoff', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  16: { PRODUCTION_OPERATOR: 'none', HEAD_OF_PRODUCTION: 'signoff', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
  17: { PRODUCTION_OPERATOR: 'none', HEAD_OF_PRODUCTION: 'view', QUALITY_UNIT: 'signoff', MANAGEMENT_COMPLIANCE: 'view' },
  18: { PRODUCTION_OPERATOR: 'signoff', HEAD_OF_PRODUCTION: 'signoff', QUALITY_UNIT: 'signoff', MANAGEMENT_COMPLIANCE: 'view' },
  19: { PRODUCTION_OPERATOR: 'edit', HEAD_OF_PRODUCTION: 'edit', QUALITY_UNIT: 'edit', MANAGEMENT_COMPLIANCE: 'view' },
  20: { PRODUCTION_OPERATOR: 'none', HEAD_OF_PRODUCTION: 'view', QUALITY_UNIT: 'view', MANAGEMENT_COMPLIANCE: 'view' },
}

const LEVEL_RANK: Record<AccessLevel, number> = { none: 0, view: 1, edit: 2, signoff: 3 }

export function getSectionAccess(role: Role, section: number): AccessLevel {
  if (role === 'SYSTEM_ADMINISTRATOR') return 'none'
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
