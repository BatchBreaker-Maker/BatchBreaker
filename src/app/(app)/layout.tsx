import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { AppHeader } from './AppHeader'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await verifySession()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader fullName={user.fullName} role={user.role} isAdmin={user.role === 'SYSTEM_ADMINISTRATOR'} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
