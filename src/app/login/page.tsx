import type { Metadata } from 'next'
import { LogoMark } from '@/components/Logo'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Sign in — Batch Breaker' }

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <LogoMark className="h-14 w-14" />
          <h1 className="text-lg font-semibold text-text">Batch Breaker</h1>
          <p className="text-sm text-text-muted">Good Clean Manufacturing — Soap Manufacturing Division</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
