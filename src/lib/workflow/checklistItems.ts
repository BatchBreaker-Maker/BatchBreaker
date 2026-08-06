import type { ChecklistItemKey } from '@/generated/prisma/enums'

// Section 3 (Pre-Production Checklist) item text, verbatim from the paper form.
export const CHECKLIST_ITEM_LABELS: Record<ChecklistItemKey, string> = {
  FORMULA_BATCH_SHEET_CURRENT: 'Approved formula / batch sheet in hand and current version confirmed',
  RAW_MATERIALS_DISPENSED_VERIFIED: 'Raw materials dispensed, verified, and co-signed in Store Log',
  STOREKEEPER_COSIGNATURE_OBTAINED: 'Storekeeper co-signature on Store Log and Batch Ticket obtained',
  EQUIPMENT_CLEANED_WORKING: 'All equipment cleaned and in good working condition',
  NO_OUT_OF_SERVICE_OR_CALIBRATION_DUE_TAGS: 'No "Out of Service" or "Calibration Due" tags on any equipment',
  SCALES_CALIBRATION_CURRENT: 'Scale(s) calibration current and verified',
  THERMOMETERS_CALIBRATION_CURRENT: 'Thermometer(s) calibration current and verified',
  CROSS_CONTAMINATION_PREVENTION_IN_PLACE: 'Cross-contamination prevention measures in place (area, equipment, personnel)',
  PRODUCTION_AREA_CLEARED_PREPARED: 'Production area cleared and prepared',
  PERSONAL_HYGIENE_REQUIREMENTS_MET: 'Personal hygiene requirements met (no jewelry, hair restrained, gloves, PPE)',
  PEST_CONTROL_STATUS_CONFIRMED: 'Pest control status confirmed — no evidence of infestation in area',
}

export const CHECKLIST_ITEM_ORDER = Object.keys(CHECKLIST_ITEM_LABELS) as ChecklistItemKey[]
