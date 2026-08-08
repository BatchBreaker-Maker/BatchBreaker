'use client'

import { useActionState, type ReactNode } from 'react'
import { Button, Label, Modal, Textarea } from '@/components/ui'
import type { FormActionState } from '@/server/batches/actions'

interface CorrectionModalProps {
  open: boolean
  onClose: () => void
  title: string
  action: (state: FormActionState, formData: FormData) => Promise<FormActionState>
  hiddenFields: Record<string, string>
  children: ReactNode
}

// Shared shell for every "correct this entry" flow across the 6 open-ended
// log sections — corrections are new rows, not edits to history, so this
// always ends in the same shape: the original entry's fields (pre-filled by
// the caller as `children`), a required reason, submit.
export function CorrectionModal({ open, onClose, title, action, hiddenFields, children }: CorrectionModalProps) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(action, undefined)

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form action={formAction} className="flex flex-col gap-3">
        {Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        {children}
        <div className="flex flex-col gap-1">
          <Label htmlFor="correctionReason">Reason for correction</Label>
          <Textarea id="correctionReason" name="correctionReason" rows={2} required />
        </div>
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save correction'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
