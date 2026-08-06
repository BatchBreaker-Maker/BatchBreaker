import 'server-only'
import { prisma } from '@/lib/db'

// Format: GCM-YYYYMMDD-NNN (spec §3.1), sequence resets per calendar day.
// NNN is derived from same-day count, not a DB sequence — batchNumber is
// unique, so a same-millisecond collision at our scale (6-15 users) would
// surface as a create error to retry, not a silent duplicate.
export async function generateBatchNumber(productionDate: Date): Promise<string> {
  const datePart = productionDate.toISOString().slice(0, 10).replaceAll('-', '')
  const prefix = `GCM-${datePart}-`

  const count = await prisma.batchRecord.count({
    where: { batchNumber: { startsWith: prefix } },
  })

  const sequence = String(count + 1).padStart(3, '0')
  return `${prefix}${sequence}`
}
