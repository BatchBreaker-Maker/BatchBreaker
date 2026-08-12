'use client'

import { useActionState } from 'react'
import { signOffCompletenessReview } from '@/server/completenessReview/actions'
import type { FormActionState } from '@/server/batches/actions'
import { Button } from '@/components/ui'

export function SignOffButton({
  batchRecordId,
  allAddressed,
  disabledReason,
}: {
  batchRecordId: string
  allAddressed: boolean
  disabledReason?: string
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    signOffCompletenessReview,
    undefined,
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="batchRecordId" value={batchRecordId} />
      {state?.error && <p className="mb-2 text-sm text-danger">{state.error}</p>}
      <Button
        type="submit"
        variant="secondary"
        disabled={!allAddressed || pending}
        title={allAddressed ? undefined : (disabledReason ?? 'All items must be verified or marked N/A first')}
      >
        {pending ? 'Signing off…' : 'Sign off Section 16 and submit for QC review'}
      </Button>
    </form>
  )
}
