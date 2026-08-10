import { redirect } from 'next/navigation'

// Section 1 (Batch Identification) has no dedicated page of its own — its
// fields are shown on the batch overview page — so this route exists only
// to send anyone who lands on /sections/1 (an old link, a bookmark, browser
// history) to where that data actually lives, instead of a 404.
export default async function Section1RedirectPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = await params
  redirect(`/batches/${batchId}`)
}
