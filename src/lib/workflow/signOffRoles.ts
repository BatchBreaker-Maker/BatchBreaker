import type { Role, SignOffRole } from '@/generated/prisma/enums'

// Section 18 (Final Sign-Off) has exactly three signature slots. Unlike the
// full Role enum, HEAD_OF_QC and QC_USER both map to the single "QC" slot —
// either one provides the required QC co-signature, matching how
// permissionMatrix grants both roles 'signoff' on section 18.
export const SIGN_OFF_ROLE_ORDER: { role: SignOffRole; label: string }[] = [
  { role: 'PRODUCTION_OPERATOR', label: 'Production Operator' },
  { role: 'HEAD_OF_PRODUCTION', label: 'Head of Production' },
  { role: 'QC', label: 'Head of Quality / QC' },
]

export function userSignOffRole(role: Role): SignOffRole | null {
  switch (role) {
    case 'PRODUCTION_OPERATOR':
      return 'PRODUCTION_OPERATOR'
    case 'HEAD_OF_PRODUCTION':
      return 'HEAD_OF_PRODUCTION'
    case 'HEAD_OF_QC':
    case 'QC_USER':
      return 'QC'
    default:
      return null
  }
}
