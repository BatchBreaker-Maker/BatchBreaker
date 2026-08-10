'use server'

import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'

export interface BatchSearchResult {
  id: string
  batchNumber: string
  productName: string
}

const MAX_RESULTS = 8

export async function searchBatchesByNumber(query: string): Promise<BatchSearchResult[]> {
  const user = await verifySession()
  const trimmed = query.trim()
  if (!user || !trimmed || !canAccessSection(user.role, 1, 'view')) return []

  return prisma.batchRecord.findMany({
    where: { batchNumber: { contains: trimmed, mode: 'insensitive' } },
    select: { id: true, batchNumber: true, productName: true },
    orderBy: { createdAt: 'desc' },
    take: MAX_RESULTS,
  })
}
