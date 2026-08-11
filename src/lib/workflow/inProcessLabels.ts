// Section 6.1 — the 7 fixed step rows from the paper form. Unlike the old
// dropdown-based design, this text is fixed (not client-editable) — the
// server sets stepDescription from this table directly, matching how
// EQUIPMENT_ROW_LABELS' row names aren't editable either. Anything beyond
// these 7 steps goes in the open-ended "Additional Steps" list instead of a
// fixed 8th row.
export const PROCESSING_STEP_LABELS: Record<number, string> = {
  1: 'Lye solution prepared (and meets temperature requirements)',
  2: 'Base oils measured and combined (and meets temperature requirements)',
  3: 'Fragrance / colorant / additives incorporated',
  4: 'Lye solution added to oils at correct temperature',
  5: 'Soap mixed to trace (note the total time mixed)',
  6: 'Soap poured into molds',
  7: 'Molds moved and covered (if applicable)',
}

export const PROCESSING_STEP_ORDER = Object.keys(PROCESSING_STEP_LABELS).map(Number)

export const HOMOGENEITY_ITEM_LABELS: Record<string, string> = {
  HOMOGENEITY: 'Homogeneity (uniform appearance throughout)',
  ABSENCE_OF_FOREIGN_MATTER: 'Absence of foreign matter',
  FRAGRANCE_INCORPORATION: 'Proper incorporation of fragrance',
  COLORANT_INCORPORATION: 'Proper incorporation of colorant / additives',
  NO_SEPARATION_OR_RICING: 'No signs of separation or ricing',
}

export const HOMOGENEITY_ITEM_ORDER = Object.keys(HOMOGENEITY_ITEM_LABELS)
