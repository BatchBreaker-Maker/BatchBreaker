import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { logout } from '@/lib/auth/actions'
import { canAccessSection } from '@/lib/auth/permissionMatrix'

export default async function DashboardPage() {
  const user = await verifySession()
  if (!user) redirect('/login')

  const canCreateBatch = canAccessSection(user.role, 1, 'edit')
  const batches = canAccessSection(user.role, 1, 'view')
    ? await prisma.batchRecord.findMany({
        orderBy: { createdAt: 'desc' },
        include: { product: true },
        take: 20,
      })
    : []

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Welcome, {user.fullName}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Role: {user.role.replaceAll('_', ' ')}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="rounded border px-4 py-2 text-sm">
            Sign out
          </button>
        </form>
      </div>

      {canCreateBatch && (
        <Link
          href="/batches/new"
          className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + New batch record
        </Link>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Batch records</h2>
        {batches.length === 0 ? (
          <p className="text-sm text-zinc-500">No batch records yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800 max-w-2xl">
            {batches.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <Link href={`/batches/${b.id}`} prefetch={false} className="hover:underline">
                  {b.batchNumber} — {b.product.productName}
                </Link>
                <span className="text-xs text-zinc-500">{b.status.replaceAll('_', ' ')}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
