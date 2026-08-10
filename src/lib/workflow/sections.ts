// Appendix A of the spec — section number to title, for nav/display.
export const SECTION_TITLES: Record<number, string> = {
  1: 'Batch Identification',
  2: 'Production Personnel',
  3: 'Pre-Production Checklist',
  4: 'Raw Material Log',
  5: 'Raw Material Temperatures',
  6: 'In-Process Production Record',
  7: 'Soap Block Cutting Observations',
  8: 'Bar Stamping / Press Operations',
  9: 'In-Process Sampling Log',
  10: 'Yield Reconciliation',
  11: 'Packaging Operations',
  12: 'Retained Sample Record',
  13: 'Equipment & Cleaning Verification',
  14: 'Deviations & Incidents',
  15: 'Bulk Product Storage & Post-Production Closeout',
  16: 'Batch Record Completeness Review',
  17: 'Batch Release Decision',
  18: 'Final Sign-Off',
  19: 'Additional Observations & Notes',
  20: 'Change History',
}

// All 20 sections have a working page as of Phase 2.
export const IMPLEMENTED_SECTIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
] as const

// Section 1 (Batch Identification) has no dedicated /sections/1 route — its
// fields are shown directly on the batch overview page, so it links there
// instead of a route that doesn't exist.
export function sectionHref(batchId: string, sectionNumber: number): string {
  return sectionNumber === 1 ? `/batches/${batchId}` : `/batches/${batchId}/sections/${sectionNumber}`
}
