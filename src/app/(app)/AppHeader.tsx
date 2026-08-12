import Link from 'next/link'
import { logout } from '@/lib/auth/actions'
import { Logo } from '@/components/Logo'
import { Button, buttonClassName } from '@/components/ui'
import { HeaderBatchSearch } from './HeaderBatchSearch'
import type { Role } from '@/generated/prisma/enums'

export function AppHeader({ fullName, role, isAdmin }: { fullName: string; role: Role; isAdmin: boolean }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 sm:px-6">
      <Link href="/dashboard" className="shrink-0">
        <Logo />
      </Link>
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="hidden text-sm text-text-muted sm:inline">
          {fullName} — {role.replaceAll('_', ' ')}
        </span>
        <HeaderBatchSearch />
        {isAdmin && (
          <Link href="/admin" className="text-sm font-medium text-text hover:text-accent">
            Admin
          </Link>
        )}
        <Link href="/dashboard" className={buttonClassName('secondary')}>
          All Batches
        </Link>
        <form action={logout}>
          <Button type="submit" variant="secondary">
            Sign Out
          </Button>
        </form>
      </div>
    </header>
  )
}
