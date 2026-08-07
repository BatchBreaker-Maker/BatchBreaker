import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { updateUserRole, toggleUserActive } from '@/server/admin/actions'
import { CreateUserForm } from './CreateUserForm'

const ROLE_OPTIONS = [
  ['PRODUCTION_OPERATOR', 'Production Operator'],
  ['HEAD_OF_PRODUCTION', 'Head of Production'],
  ['QUALITY_UNIT', 'Quality Unit'],
  ['MANAGEMENT_COMPLIANCE', 'Management / Compliance'],
  ['SYSTEM_ADMINISTRATOR', 'System Administrator'],
] as const

export default async function AdminPage() {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (user.role !== 'SYSTEM_ADMINISTRATOR') {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">You do not have permission to view this page.</p>
      </div>
    )
  }

  const users = await prisma.user.findMany({ orderBy: { fullName: 'asc' } })

  return (
    <div className="flex flex-col gap-8 p-8">
      <h1 className="text-xl font-semibold">Admin — User Accounts</h1>

      <section className="flex flex-col gap-3">
        <div className="overflow-x-auto">
          <table className="w-full max-w-4xl text-sm">
            <thead>
              <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Username</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-4">{u.fullName}</td>
                  <td className="py-2 pr-4">{u.username}</td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4">
                    <form action={updateUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      >
                        {ROLE_OPTIONS.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <button type="submit" className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700">
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="py-2 pr-4">
                    <form action={toggleUserActive} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <span className={u.isActive ? 'text-green-700 dark:text-green-500' : 'text-zinc-500'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button type="submit" className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700">
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Create User</h2>
        <CreateUserForm />
      </section>
    </div>
  )
}
