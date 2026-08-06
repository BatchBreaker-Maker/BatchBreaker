import 'server-only'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '@/lib/db'

const COOKIE_NAME = 'session'
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // spec §7.1: 30 min inactivity timeout

function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return secret
}

const encodedSecret = new TextEncoder().encode(requireSessionSecret())

async function signSessionToken(sessionId: string, expiresAt: Date): Promise<string> {
  return new SignJWT({ sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(encodedSecret)
}

async function readSessionIdFromToken(token: string | undefined): Promise<string | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, encodedSecret, { algorithms: ['HS256'] })
    return typeof payload.sessionId === 'string' ? payload.sessionId : null
  } catch {
    return null
  }
}

// Cookie writes are only legal from a Server Action or Route Handler — Next.js
// throws if called during a Server Component render. createSession and
// deleteSession are only ever invoked from Server Actions (login/logout).
export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + INACTIVITY_TIMEOUT_MS)
  const session = await prisma.session.create({ data: { userId, expiresAt } })
  const token = await signSessionToken(session.id, expiresAt)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  const sessionId = await readSessionIdFromToken(cookieStore.get(COOKIE_NAME)?.value)
  if (sessionId) {
    // Deleting the row is what makes revocation immediate (spec §3.2) — the
    // signed cookie alone would otherwise stay "validly signed" until it expires.
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
  }
  cookieStore.delete(COOKIE_NAME)
}

/**
 * The authoritative ("secure") session check — always re-reads role and
 * active status from the database rather than trusting the signed cookie, so
 * a deactivated user loses access on their next request, not just once their
 * token expires. Read-only with respect to cookies: Next.js only allows
 * cookie mutation from Server Actions/Route Handlers/Proxy, and this is
 * called from ordinary Server Component renders too. Cached per request.
 *
 * Note: does not slide the inactivity window on read — sessions expire a
 * fixed 30 minutes after creation for now. True sliding-on-activity needs
 * the refresh done in Proxy (the one place allowed to both read the DB and
 * write response cookies on every request); deferred as a later refinement
 * rather than adding that while still proving the Phase 1 thin slice.
 */
export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const sessionId = await readSessionIdFromToken(cookieStore.get(COOKIE_NAME)?.value)
  if (!sessionId) return null

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }

  return session.user
})
