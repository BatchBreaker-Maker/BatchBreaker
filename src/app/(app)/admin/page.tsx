import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { updateUserRole, toggleUserActive } from '@/server/admin/actions'
import { Badge, Button, Select, Table, TBody, TD, TH, THead, TR } from '@/components/ui'
import { CreateUserForm } from './CreateUserForm'

const ROLE_OPTIONS = [
  ['PRODUCTION_OPERATOR', 'Production Operator'],
  ['HEAD_OF_PRODUCTION', 'Head of Production'],
  ['HEAD_OF_QC', 'Head of QC'],
  ['QC_USER', 'QC User'],
  ['MANAGEMENT_COMPLIANCE', 'Management / Compliance'],
  ['SYSTEM_ADMINISTRATOR', 'System Administrator'],
] as const

export default async function AdminPage() {
  const user = await verifySession()
  if (!user) redirect('/login')
  if (user.role !== 'SYSTEM_ADMINISTRATOR') {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">You do not have permission to view this page.</p>
      </div>
    )
  }

  const users = await prisma.user.findMany({ orderBy: { fullName: 'asc' } })

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-text">Admin — User Accounts</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">Users</h2>
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Username</TH>
              <TH>Email</TH>
              <TH>Role</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {users.map((u) => (
              <TR key={u.id}>
                <TD>{u.fullName}</TD>
                <TD>{u.username}</TD>
                <TD>{u.email}</TD>
                <TD>
                  <form action={updateUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <Select name="role" defaultValue={u.role}>
                      {ROLE_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </Select>
                    <Button type="submit" variant="secondary">
                      Save
                    </Button>
                  </form>
                </TD>
                <TD>
                  <form action={toggleUserActive} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <Badge status={u.isActive ? 'success' : 'neutral'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                    <Button type="submit" variant="secondary">
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </form>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </section>

      <section className="mx-auto flex w-full max-w-lg flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">Create User</h2>
        <CreateUserForm />
      </section>
    </div>
  )
}
