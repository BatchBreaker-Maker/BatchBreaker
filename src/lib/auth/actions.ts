'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { createSession, deleteSession, verifySession } from '@/lib/auth/session'
import { recordAuditEntry } from '@/lib/audit/recordAuditEntry'

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export type LoginState = { error?: string } | undefined

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: 'Username and password are required.' }
  }
  const { username, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { username } })
  const validPassword = user ? await verifyPassword(password, user.passwordHash) : false

  if (!user || !user.isActive || !validPassword) {
    await recordAuditEntry({
      actionType: 'LOGIN_FAILURE',
      entityType: 'User',
      entityId: user?.id ?? username,
      userId: user?.id ?? null,
      attemptedUsername: username,
    })
    return { error: 'Invalid username or password.' }
  }

  await createSession(user.id)
  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } })
  await recordAuditEntry({
    actionType: 'LOGIN_SUCCESS',
    entityType: 'User',
    entityId: user.id,
    userId: user.id,
  })

  redirect('/dashboard')
}

export async function logout() {
  const user = await verifySession()
  await deleteSession()
  if (user) {
    await recordAuditEntry({
      actionType: 'LOGOUT',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
    })
  }
  redirect('/login')
}
