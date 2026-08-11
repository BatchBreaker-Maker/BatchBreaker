'use client'

import { useActionState } from 'react'
import { createUser } from '@/server/admin/actions'
import type { FormActionState } from '@/server/batches/actions'
import { Button, Input, Label, Select } from '@/components/ui'

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(createUser, undefined)

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" name="fullName" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="password">Initial Password</Label>
        <Input id="password" name="password" type="password" minLength={8} required />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="role">Role</Label>
        <Select id="role" name="role" defaultValue="PRODUCTION_OPERATOR" required>
          <option value="PRODUCTION_OPERATOR">Production Operator</option>
          <option value="HEAD_OF_PRODUCTION">Head of Production</option>
          <option value="HEAD_OF_QC">Head of QC</option>
          <option value="QC_USER">QC User</option>
          <option value="MANAGEMENT_COMPLIANCE">Management / Compliance</option>
          <option value="SYSTEM_ADMINISTRATOR">System Administrator</option>
        </Select>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Creating…' : 'Create user'}
      </Button>
    </form>
  )
}
