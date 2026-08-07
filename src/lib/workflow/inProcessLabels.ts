// Section 6.1 — default step descriptions from the paper form. Step 8 ("Other")
// and any step are still freely editable; these are just the pre-fill text.
export const PROCESSING_STEP_DEFAULTS: Record<number, string> = {
  1: 'Lye solution prepared (and meets temperature requirements)',
  2: 'Base oils measured and combined (and meets temperature requirements)',
  3: 'Fragrance / colorant / additives incorporated',
  4: 'Lye solution added to oils at correct temperature',
  5: 'Soap mixed to trace (note the total time mixed)',
  6: 'Soap poured into molds',
  7: 'Molds moved and covered (if applicable)',
  8: '',
}

export const HOMOGENEITY_ITEM_LABELS: Record<string, string> = {
  HOMOGENEITY: 'Homogeneity (uniform appearance throughout)',
  ABSENCE_OF_FOREIGN_MATTER: 'Absence of foreign matter',
  FRAGRANCE_INCORPORATION: 'Proper incorporation of fragrance',
  COLORANT_INCORPORATION: 'Proper incorporation of colorant / additives',
  NO_SEPARATION_OR_RICING: 'No signs of separation or ricing',
}

export const HOMOGENEITY_ITEM_ORDER = Object.keys(HOMOGENEITY_ITEM_LABELS)
