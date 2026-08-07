import type { CompletenessReviewItemKey } from '@/generated/prisma/enums'

// Section 16 — 21 fixed items printed on the paper form's completeness review.
export const COMPLETENESS_ITEM_LABELS: Record<CompletenessReviewItemKey, string> = {
  FORMULA_VERSION_DOCUMENTED: 'Formula number and version documented (Section 1)',
  RAW_MATERIALS_RECORDED_WITH_COA_AND_QUALIFICATION:
    'All raw materials recorded with COA status and supplier qualification (Section 4)',
  PRODUCTION_STEPS_COMPLETED_INITIALED: 'All production steps completed and initialed (Section 6)',
  TEMPERATURES_RECORDED: 'Raw material and process temperatures recorded (Section 5)',
  SAMPLING_LOG_COMPLETE_WITH_DISPOSITION: 'In-process sampling log complete with disposition recorded (Section 9)',
  PH_AND_FREE_CAUSTIC_RECORDED: 'pH and free caustic results recorded (Section 6)',
  YIELD_RECONCILIATION_COMPLETED: 'Yield reconciliation completed (Section 10)',
  CURE_HOLD_RECORD_COMPLETED: 'Cure / hold record completed (Section 6)',
  CUTTING_OBSERVATIONS_RECORDED: 'Cutting observations recorded (Section 7)',
  COMPLAINT_RECALL_AE_FIELDS_COMPLETED_OR_NA: 'Complaint, recall, and adverse event fields completed or marked N/A (Section 1)',
  DEVIATION_SECTION_COMPLETED: 'Deviation section completed — all deviations resolved or none confirmed (Section 14)',
  RETAINED_SAMPLES_DOCUMENTED: 'Retained samples documented (Section 12)',
  EQUIPMENT_CLEANING_VERIFICATION_COMPLETE: 'Equipment cleaning and verification complete (Section 13)',
  PACKAGING_OPERATIONS_COMPLETE: 'Packaging operations complete (Section 11)',
  SUBCONTRACTING_FIELD_COMPLETED_OR_NA: 'Subcontracting field completed or marked N/A (Section 15)',
  POST_PRODUCTION_CLOSEOUT_ENTRIES_MADE: 'Post-production closeout entries made (Section 15)',
  RETENTION_DEADLINE_ENTERED: 'Record retention deadline entered (Section 1)',
  NO_BLANK_FIELDS: 'No blank / unaddressed fields remain in the batch record',
  CORRECTIONS_PROPERLY_MADE: 'Any corrections made are properly documented (single line-through, initialed, dated)',
  FINISHED_PRODUCT_SPEC_REFERENCED: 'Finished product specification referenced (Section 1)',
  BATCH_STATUS_DECISION_COMPLETED: 'Batch record ready for QC release decision (Section 17)',
}

export const COMPLETENESS_ITEM_ORDER = Object.keys(COMPLETENESS_ITEM_LABELS) as CompletenessReviewItemKey[]
