import 'server-only'
import { prisma } from '@/lib/db'

export function fetchBatchForPdf(batchId: string) {
  return prisma.batchRecord.findUnique({
    where: { id: batchId },
    include: {
      createdBy: true,
      checklistItems: { include: { hopSignoffUser: true }, orderBy: { itemKey: 'asc' } },
      rawMaterialEntries: { orderBy: { lineNumber: 'asc' } },
      temperatureEntries: { orderBy: { lineNumber: 'asc' } },
      processingSteps: { orderBy: { stepNumber: 'asc' } },
      homogeneityChecks: true,
      cureRecords: true,
      cuttingObservations: { orderBy: { pourNumber: 'asc' } },
      stampingSetup: { include: { setupVerifiedByUser: true } },
      pressRuns: { orderBy: { dateTime: 'asc' } },
      samplingEntries: { orderBy: { dateTime: 'asc' } },
      yieldReconciliation: true,
      prePackagingChecklistItems: { orderBy: { itemKey: 'asc' } },
      packagingChecks: { orderBy: { checkNumber: 'asc' } },
      packagingReturn: true,
      retainedSampleRecord: { include: { collectedByUser: true, destructionAuthorizedByUser: true } },
      equipmentVerifications: { orderBy: { rowKey: 'asc' } },
      additionalEquipmentEntries: { include: { verifiedByUser: true }, orderBy: { createdAt: 'asc' } },
      deviations: { include: { reportedToUser: true, resolvedByUser: true }, orderBy: { sequenceNumber: 'asc' } },
      noDeviationsConfirmedByUser: true,
      postProductionCloseout: { include: { closeoutByUser: true } },
      completenessReviewItems: { include: { hopSignatureUser: true }, orderBy: { itemKey: 'asc' } },
      notes: { include: { authorUser: true }, orderBy: { createdAt: 'asc' } },
      releaseDecision: { include: { reviewedBy: true } },
      signOffs: { include: { user: true } },
    },
  })
}
