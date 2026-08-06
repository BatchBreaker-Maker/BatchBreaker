import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import bcrypt from 'bcryptjs'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const SEED_USERS = [
  { username: 'operator1', fullName: 'Pat Operator', email: 'operator1@example.test', role: 'PRODUCTION_OPERATOR' as const },
  { username: 'hop1', fullName: 'Harper Production', email: 'hop1@example.test', role: 'HEAD_OF_PRODUCTION' as const },
  { username: 'qc1', fullName: 'Quinn Quality', email: 'qc1@example.test', role: 'QUALITY_UNIT' as const },
  { username: 'mgmt1', fullName: 'Morgan Management', email: 'mgmt1@example.test', role: 'MANAGEMENT_COMPLIANCE' as const },
  { username: 'admin1', fullName: 'Alex Admin', email: 'admin1@example.test', role: 'SYSTEM_ADMINISTRATOR' as const },
]

// Local dev only — every seed user shares this password so the Phase 1
// happy-path E2E test can log in as any role without per-user secrets.
const DEV_PASSWORD = 'DevPassword123!'

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12)

  for (const u of SEED_USERS) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { ...u, passwordHash },
    })
  }
  console.log(`Seeded ${SEED_USERS.length} users (password for all: ${DEV_PASSWORD})`)

  const admin = await prisma.user.findUniqueOrThrow({ where: { username: 'admin1' } })

  const product = await prisma.product.upsert({
    where: { productCodeSku: 'BAR-LAV-001' },
    update: {},
    create: {
      productName: 'Lavender Oatmeal Bar Soap',
      productCodeSku: 'BAR-LAV-001',
      productType: 'BAR_SOAP',
      finishedProductSpecRef: 'SPEC-BAR-LAV-001',
    },
  })

  const formula = await prisma.formula.upsert({
    where: { productId_formulaNumber_version: { productId: product.id, formulaNumber: 'MFR-LAV-001', version: '1.0' } },
    update: {},
    create: {
      productId: product.id,
      formulaNumber: 'MFR-LAV-001',
      version: '1.0',
      effectiveDate: new Date('2026-01-01'),
      isCurrent: true,
      createdById: admin.id,
    },
  })
  console.log(`Seeded product "${product.productName}" with formula ${formula.formulaNumber} v${formula.version}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
