import 'server-only'
import { prisma } from '@/lib/db'
import type { AuditActionType } from '@/generated/prisma/enums'

interface RecordAuditEntryInput {
  actionType: AuditActionType
  entityType: string
  entityId: string
  userId?: string | null
  attemptedUsername?: string | null
  batchRecordId?: string | null
  fieldName?: string | null
  oldValue?: string | null
  newValue?: string | null
  correctionReason?: string | null
  ipAddress?: string | null
  sessionId?: string | null
}

/**
 * The only write path into audit_trail_entries. Every mutation, approval,
 * sign-off, and login event in the app should go through this function so
 * the audit trail can't drift out of sync with what actually happened
 * (spec §6.2 — every data entry must be recorded with user, timestamp,
 * before/after values).
 */
export async function recordAuditEntry(input: RecordAuditEntryInput) {
  return prisma.auditTrailEntry.create({
    data: {
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId ?? null,
      attemptedUsername: input.attemptedUsername ?? null,
      batchRecordId: input.batchRecordId ?? null,
      fieldName: input.fieldName ?? null,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      correctionReason: input.correctionReason ?? null,
      ipAddress: input.ipAddress ?? null,
      sessionId: input.sessionId ?? null,
    },
  })
}
