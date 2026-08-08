import type { ProductType, Role, SectionStatus } from '@/generated/prisma/enums'
import { getSectionAccess } from '@/lib/auth/permissionMatrix'
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
