import 'server-only'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Every mutating action redirects back into a page under the batch layout,
// which renders the progress bar and per-section status dots. Without this,
// a Server Action's redirect() reuses the cached layout render (Next only
// promises the *page* segment is fresh), so the bar/dots silently show
// stale data until a manual reload — exactly the kind of thing that erodes
// trust in a "tool a production worker can trust."
export function redirectToBatch(path: string): never {
  revalidatePath('/(app)/batches/[batchId]', 'layout')
  redirect(path)
}
