import type { PrePackagingChecklistItemKey } from '@/generated/prisma/enums'

export const PRE_PACKAGING_ITEM_LABELS: Record<PrePackagingChecklistItemKey, string> = {
  AREA_CLEARED: 'Packaging area cleared before start',
  EQUIPMENT_CLEANED_HOP_VERIFIED: 'Packaging equipment cleaned and Head of Production verified',
  COMPONENTS_FIFO_STORE_LOG: 'Packaging components dispensed via FIFO and recorded in Store Log',
  COA_INSPECTION_REVIEWED: 'Packaging component COA / incoming inspection records reviewed and acceptable',
  LABEL_VERSION_CONFIRMED: 'Label version / revision confirmed against current approved version',
  WIP_MARKED_PRODUCT_BATCH: 'Work-in-process marked with product name and batch number',
}

export const PRE_PACKAGING_ITEM_ORDER = Object.keys(PRE_PACKAGING_ITEM_LABELS) as PrePackagingChecklistItemKey[]
