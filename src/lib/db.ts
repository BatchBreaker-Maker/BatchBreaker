import { PrismaClient } from '@/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

// APP_DATABASE_URL is the restricted app_runtime role (no UPDATE/DELETE on
// audit_trail_entries) — deliberately not DATABASE_URL, which is the owner
// credential reserved for the Prisma CLI (migrate/seed/db execute).
const adapter = new PrismaNeon({ connectionString: process.env.APP_DATABASE_URL! })

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
