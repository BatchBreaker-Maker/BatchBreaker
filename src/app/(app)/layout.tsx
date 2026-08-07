import { redirect } from 'next/navigation'
import Link from 'next/link'
import { verifySession } from '@/lib/auth/session'
import { logout } from '@/lib/auth/actions'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await verifySession()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <Link href="/dashboard" className="text-sm font-semibold hover:underline">
          Batch Record Management System
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.fullName} — {user.role.replaceAll('_', ' ')}
          </span>
          {user.role === 'SYSTEM_ADMINISTRATOR' && (
            <Link href="/admin" className="text-sm hover:underline">
              Admin
            </Link>
          )}
          <form action={logout}>
            <button type="submit" className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
