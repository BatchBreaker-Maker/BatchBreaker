'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { hashPassword } from '@/lib/auth/password'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'
import type { FormActionState } from '@/server/batches/actions'

const ROLES = [
  'PRODUCTION_OPERATOR',
  'HEAD_OF_PRODUCTION',
  'HEAD_OF_QC',
  'QC_USER',
  'MANAGEMENT_COMPLIANCE',
  'SYSTEM_ADMINISTRATOR',
] as const

// /admin isn't one of the 20 batch sections, so it doesn't go through
// requireSectionAccess — this is the whole gate for every action here.
function requireAdmin(role: string): void {
  if (role !== 'SYSTEM_ADMINISTRATOR') {
    throw new Error('Only System Administrators can manage user accounts.')
  }
}

const CreateUserSchema = z.object({
  fullName: z.string().min(1),
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ROLES),
})

export async function createUser(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await verifySession()
  if (!user) redirect('/login')
  requireAdmin(user.role)

  const parsed = CreateUserSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: 'Please fill in all fields — password must be at least 8 characters.' }
  }
  const data = parsed.data

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: data.username }, { email: data.email }] },
  })
  if (existing) {
    return { error: 'A user with that username or email already exists.' }
  }

  const passwordHash = await hashPassword(data.password)
  const created = await prisma.user.create({
    data: {
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      passwordHash,
      role: data.role,
    },
  })

  await recordAuditEntry({
    actionType: 'CREATE',
    entityType: 'User',
    entityId: created.id,
    userId: user.id,
    newValue: `${data.username} (${data.role})`,
  })

  redirect('/admin')
}

const UpdateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(ROLES),
})

export async function updateUserRole(formData: FormData): Promise<void> {
  const user = await verifySession()
  if (!user) redirect('/login')
  requireAdmin(user.role)

  const parsed = UpdateRoleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Invalid role update.')
  const data = parsed.data

  const target = await prisma.user.findUnique({ where: { id: data.userId } })
  if (!target) throw new Error('User not found.')

  await prisma.user.update({ where: { id: data.userId }, data: { role: data.role } })
  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'User',
    entityId: data.userId,
    userId: user.id,
    fieldName: 'role',
    oldValue: target.role,
    newValue: data.role,
  })

  redirect('/admin')
}

export async function toggleUserActive(formData: FormData): Promise<void> {
  const user = await verifySession()
  if (!user) redirect('/login')
  requireAdmin(user.role)

  const userId = String(formData.get('userId') ?? '')
  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) throw new Error('User not found.')

  const nextActive = !target.isActive
  await prisma.user.update({ where: { id: userId }, data: { isActive: nextActive } })
  await recordAuditEntry({
    actionType: 'EDIT',
    entityType: 'User',
    entityId: userId,
    userId: user.id,
    fieldName: 'isActive',
    oldValue: String(target.isActive),
    newValue: String(nextActive),
  })

  redirect('/admin')
}
