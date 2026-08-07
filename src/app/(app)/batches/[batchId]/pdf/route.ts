import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { verifySession } from '@/lib/auth/session'
import { canAccessSection } from '@/lib/auth/permissionMatrix'
import { fetchBatchForPdf } from '@/lib/pdf/fetchBatchForPdf'
import { BatchRecordPdf } from '@/lib/pdf/BatchRecordPdf'

// @react-pdf/renderer's server-side rendering isn't Edge-compatible.
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const user = await verifySession()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  if (!canAccessSection(user.role, 1, 'view')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { batchId } = await params
  const batch = await fetchBatchForPdf(batchId)
  if (!batch) return new NextResponse('Not found', { status: 404 })

  const buffer = await renderToBuffer(BatchRecordPdf({ batch }))

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${batch.batchNumber}.pdf"`,
    },
  })
}
