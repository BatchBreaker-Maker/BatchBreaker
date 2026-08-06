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
  15: 'Bulk Storage & Post-Production Closeout',
  16: 'Batch Record Completeness Review',
  17: 'Batch Release Decision',
  18: 'Final Sign-Off',
  19: 'Additional Observations & Notes',
  20: 'Change History',
}

// Sections with a working page in this build. The remaining sections exist
// in the spec/data model but their UI ships in later phases (see build plan).
export const IMPLEMENTED_SECTIONS = [1, 2, 3, 17, 18, 20] as const
