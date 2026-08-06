import 'server-only'
import { createHash } from 'node:crypto'

/**
 * Audit-grade hash for an electronic signature event (spec §6.3 / §4.2
 * FinalSignOff.electronic_signature_hash). Binds the signature to the
 * specific user, batch record, section, and moment in time so it cannot be
 * copied onto a different record or replayed later.
 */
export function computeSignatureHash(params: {
  userId: string
  batchRecordId: string
  section: number
  timestamp: Date
}): string {
  const secret = process.env.E_SIGNATURE_SECRET
  if (!secret) throw new Error('E_SIGNATURE_SECRET is not set')
  const payload = `${params.userId}|${params.batchRecordId}|${params.section}|${params.timestamp.toISOString()}`
  return createHash('sha256').update(payload + secret).digest('hex')
}
