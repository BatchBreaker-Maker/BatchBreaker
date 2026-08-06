import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Sign in — BRMS' }

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold">Batch Record Management System</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Good Clean Manufacturing — Soap Manufacturing Division
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
