'use client'

import { useActionState } from 'react'
import { createUser } from '@/server/admin/actions'
import type { FormActionState } from '@/server/batches/actions'

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(createUser, undefined)
  const inputClass = 'rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900'
  const labelClass = 'text-sm font-medium'

  return (
    <form action={formAction} className="flex flex-col gap-3 max-w-md">
      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="fullName">Full Name</label>
        <input id="fullName" name="fullName" className={inputClass} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="username">Username</label>
          <input id="username" name="username" className={inputClass} required />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className={inputClass} required />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="password">Initial Password</label>
        <input id="password" name="password" type="password" minLength={8} className={inputClass} required />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor="role">Role</label>
        <select id="role" name="role" className={inputClass} defaultValue="PRODUCTION_OPERATOR" required>
          <option value="PRODUCTION_OPERATOR">Production Operator</option>
          <option value="HEAD_OF_PRODUCTION">Head of Production</option>
          <option value="QUALITY_UNIT">Quality Unit</option>
          <option value="MANAGEMENT_COMPLIANCE">Management / Compliance</option>
          <option value="SYSTEM_ADMINISTRATOR">System Administrator</option>
        </select>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? 'Creating…' : 'Create user'}
      </button>
    </form>
  )
}
