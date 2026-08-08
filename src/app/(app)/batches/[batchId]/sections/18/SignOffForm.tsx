'use client'

import { useActionState } from 'react'
import { signFinalSignOff } from '@/server/release/actions'
import type { FormActionState } from '@/server/batches/actions'
import { Button, Input } from '@/components/ui'

export function SignOffForm({ batchRecordId }: { batchRecordId: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(signFinalSignOff, undefined)

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      <Input type="password" name="password" placeholder="Re-enter your password to sign" required className="min-w-0 flex-1" />
      <Button type="submit" disabled={pending}>
        {pending ? 'Signing…' : 'Sign'}
      </Button>
      {state?.error && <p className="w-full text-sm text-danger">{state.error}</p>}
    </form>
  )
}
