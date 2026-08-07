'use client'

import { useActionState } from 'react'
import { signFinalSignOff } from '@/server/release/actions'
import type { FormActionState } from '@/server/batches/actions'

export function SignOffForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(signFinalSignOff, undefined)

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <input
        type="password"
        name="password"
        placeholder="Re-enter your password to sign"
        required
        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-3 py-1 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Signing…' : 'Sign'}
      </button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  )
}
