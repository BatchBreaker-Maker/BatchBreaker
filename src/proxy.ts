import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_ROUTES = ['/login']

// Optimistic only: confirms a validly-signed, unexpired session cookie exists,
// with no DB round trip. This is a UX redirect, not the security boundary —
// every Server Action re-checks via verifySession()/requireSectionAccess()
// regardless of what Proxy decided (a Proxy matcher change can silently skip
// Server Function calls on that path, so Proxy alone is not enough).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session')?.value
  const hasPlausibleSession = token ? await isSignedAndUnexpired(token) : false

  if (!hasPlausibleSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

async function isSignedAndUnexpired(token: string): Promise<boolean> {
  const secret = process.env.SESSION_SECRET
  if (!secret) return false
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] })
    return true
  } catch {
    return false
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
