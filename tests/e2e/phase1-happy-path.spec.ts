import { test, expect, type Page, type Locator } from '@playwright/test'

const PASSWORD = 'DevPassword123!'

async function login(page: Page, username: string) {
  await page.goto('/login')
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/dashboard')
}

async function logout(page: Page) {
  // Not every page (e.g. an access-denied section) has nav chrome with a
  // sign-out control, so go somewhere that reliably does first.
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL('**/login')
}

// Next.js Server Actions submitted via <form action={fn}> run as a plain
// fetch() POST with a client-side transition on completion — there is no
// real browser navigation for Playwright's click() to auto-wait on, even
// when the action redirects back to the same URL. Without an explicit wait
// here, code right after .click() can run before the mutation has actually
// landed (this DB is a remote Neon instance that can take upwards of a
// minute to wake a scaled-to-zero compute, so the gap is easy to hit).
async function submitAndWait(page: Page, buttonName: string) {
  const [response] = await Promise.all([
    page.waitForResponse((resp) => resp.request().method() === 'POST', { timeout: 120_000 }),
    page.getByRole('button', { name: buttonName }).click(),
  ])
  return response
}

// Checks every checkbox in the given locator and saves — used for the
// fixed-item checklist sections (3, 11.1, 13, 16) where the item set is
// baked into the app rather than user-entered.
async function checkAllAndClick(page: Page, boxes: Locator, buttonName: string) {
  const count = await boxes.count()
  for (let i = 0; i < count; i++) await boxes.nth(i).check()
  await submitAndWait(page, buttonName)
  return count
}

test('Phase 2 happy path: full Section 1-20 chain with the real HoP/QC review workflow', async ({ page }) => {
  // This walks all 20 sections across 3 roles with many login/logout round
  // trips against a remote (Neon) dev DB — well beyond the config default.
  test.setTimeout(600_000)

  const batchNumber = `E2E-${Date.now()}`

  // --- HoP creates the batch (Section 1) — free-text fields + batch-number
  // double-entry confirmation, replacing Phase 1's auto-generated number ---
  await login(page, 'hop1')
  await page.getByRole('link', { name: '+ New batch record' }).click()
  await page.getByLabel('Batch Number', { exact: true }).fill(batchNumber)
  await page.getByLabel('Confirm Batch Number').fill(batchNumber)
  await page.getByLabel('Product Name').fill('E2E Test Bar Soap')
  await page.getByLabel('Formula / Master Formula Record #').fill('E2E-FORMULA-1')
  await page.getByLabel('Formula Version / Revision').fill('1.0')
  await page.getByLabel('Batch Size (target)').fill('50')
  await page.getByLabel('Unit').fill('lb')
  await page.getByLabel('Production Date').fill('2026-08-07')
  await Promise.all([
    page.waitForURL(/\/batches\/[0-9a-f-]+$/, { timeout: 120_000 }),
    page.getByRole('button', { name: 'Create batch record' }).click(),
  ])

  const batchId = page.url().split('/batches/')[1]
  await expect(page.getByRole('heading', { name: batchNumber })).toBeVisible()

  // --- Negative check: Production Operator cannot see Sections 16/17/20.
  // (Section 18 is a legitimate three-way sign-off that includes the
  // operator, per spec section 2.2 row 18 — not part of this check.)
  await logout(page)
  await login(page, 'operator1')
  for (const section of [16, 17, 20]) {
    await page.goto(`/batches/${batchId}/sections/${section}`)
    await expect(page.getByText('You do not have permission to view this section.')).toBeVisible()
  }

  // --- HoP assigns personnel (Section 2) ---
  await logout(page)
  await login(page, 'hop1')
  await page.goto(`/batches/${batchId}/sections/2`)
  await submitAndWait(page, 'Save personnel')
  await expect(page.getByText('COMPLETE').first()).toBeVisible()

  // --- Complete and sign off the Pre-Production Checklist (Section 3) ---
  await page.goto(`/batches/${batchId}/sections/3`)
  const sec3Count = await checkAllAndClick(page, page.locator('form input[type=checkbox]'), 'Save checklist')
  expect(sec3Count).toBe(11)
  await submitAndWait(page, 'Sign off Section 3 as Head of Production')
  await expect(page.getByText(/^Signed off by Harper Production on/)).toBeVisible()

  // --- Operator fills the production sections (4-14) ---
  await logout(page)
  await login(page, 'operator1')

  // Section 4 — Raw Material Log (default Approved qualification, no friction)
  await page.goto(`/batches/${batchId}/sections/4`)
  await page.locator('#tradeNameDescription').fill('Coconut Oil')
  await page.locator('#supplierName').fill('Acme Oils')
  await page.locator('#supplierLotBatchNumber').fill('LOT-100')
  await page.locator('#qtyDispensed').fill('20')
  await page.locator('#unit').fill('lb')
  await submitAndWait(page, 'Add entry')
  await expect(page.getByText('Coconut Oil')).toBeVisible()

  // Section 5 — Raw Material Temperatures
  await page.goto(`/batches/${batchId}/sections/5`)
  await page.locator('#materialIngredient').fill('Lye Solution')
  await page.locator('#acceptableTempMinF').fill('90')
  await page.locator('#acceptableTempMaxF').fill('110')
  await page.locator('#actualTempF').fill('100')
  await page.locator('#timeOfAddition').fill('2026-08-07T09:00')
  await submitAndWait(page, 'Add entry')
  await expect(page.getByText('Lye Solution')).toBeVisible()

  // Section 6 — In-Process Production Record (step 1 only; downstream gates
  // don't depend on 6.2-6.4 being filled)
  await page.goto(`/batches/${batchId}/sections/6`)
  await page.locator('#timePerformed').fill('2026-08-07T09:15')
  await submitAndWait(page, 'Add step')
  await expect(page.getByText('Step 1:')).toBeVisible()

  // Section 7 — Cutting Observations
  await page.goto(`/batches/${batchId}/sections/7`)
  await page.locator('#pourNumber').fill('1')
  await submitAndWait(page, 'Add observation')
  await expect(page.getByText('No cutting observations yet.')).not.toBeVisible()

  // Section 8 — Bar Stamping Setup
  await page.goto(`/batches/${batchId}/sections/8`)
  await page.locator('#dieStampId').fill('DIE-1')
  await submitAndWait(page, 'Save setup')
  await expect(page.locator('#dieStampId')).toHaveValue('DIE-1')

  // Section 9 — In-Process Sampling Log
  await page.goto(`/batches/${batchId}/sections/9`)
  await page.locator('#dateTime').fill('2026-08-07T10:00')
  await page.locator('#samplingStage').fill('Post-cut')
  await page.locator('#testType').fill('Visual')
  await submitAndWait(page, 'Add entry')
  await expect(page.getByText('Post-cut')).toBeVisible()

  // Section 10 — Yield Reconciliation
  await page.goto(`/batches/${batchId}/sections/10`)
  await page.locator('#expectedYield').fill('100')
  await page.locator('#expectedYieldUnit').fill('lb')
  await page.locator('#actualYield').fill('98')
  await page.locator('#actualYieldUnit').fill('lb')
  await submitAndWait(page, 'Save')
  await expect(page.locator('#expectedYield')).toHaveValue('100')

  // Section 11 — Packaging Operations (11.1 checklist only)
  await page.goto(`/batches/${batchId}/sections/11`)
  const sec11Boxes = page.locator('form').first().locator('input[type=checkbox]')
  const sec11Count = await checkAllAndClick(page, sec11Boxes, 'Save checklist')
  expect(sec11Count).toBe(6)

  // Section 12 — Retained Sample Record
  await page.goto(`/batches/${batchId}/sections/12`)
  await page.locator('#dateCollected').fill('2026-08-07')
  await page.locator('#storageLocation').fill('QC Retain Cabinet')
  await page.locator('#scheduledDestructionReviewDate').fill('2028-08-07')
  await submitAndWait(page, 'Save')
  await expect(page.getByText('Sample Destruction')).toBeVisible()

  // Section 13 — Equipment & Cleaning Verification (all 8 fixed rows)
  await page.goto(`/batches/${batchId}/sections/13`)
  const sec13Boxes = page.locator('input[name$="__cleaned"]')
  const sec13Count = await checkAllAndClick(page, sec13Boxes, 'Save verification')
  expect(sec13Count).toBe(8)

  // Section 14 — log one deviation that will block release below
  await page.goto(`/batches/${batchId}/sections/14`)
  await page.locator('#dateTime').fill('2026-08-07T11:00')
  await page.locator('#type').selectOption('DEVIATION')
  await page.locator('#description').fill('E2E test deviation to verify the Section 17 open-deviation gate.')
  await submitAndWait(page, 'Log deviation')
  await expect(page.getByText('Open', { exact: true })).toBeVisible()

  // --- Operator closes out the batch (Section 15) — transitions
  // IN_PROGRESS -> PENDING_HOP_REVIEW, replacing Phase 1's "Submit for QC
  // review" shortcut ---
  await page.goto(`/batches/${batchId}/sections/15`)
  await page.locator('#bulkStorageLocation').fill('Warehouse B, Rack 4')
  await page.locator('input[name="enteredInErp"][value="NA"]').check()
  await page.locator('input[name="unusedRmReturned"][value="NA"]').check()
  await page.locator('#batchCloseoutDate').fill('2026-08-07')
  await submitAndWait(page, 'Save closeout')
  await page.goto(`/batches/${batchId}`)
  await expect(page.getByText('status: PENDING HOP REVIEW')).toBeVisible()

  // --- HoP completes the Completeness Review (Section 16) and signs off —
  // transitions PENDING_HOP_REVIEW -> PENDING_QC_REVIEW ---
  await logout(page)
  await login(page, 'hop1')
  await page.goto(`/batches/${batchId}/sections/16`)
  const sec16Count = await checkAllAndClick(page, page.locator('input[name$="__verified"]'), 'Save review')
  expect(sec16Count).toBe(21)
  await submitAndWait(page, 'Sign off Section 16 and submit for QC review')
  await expect(page.getByText(/^Signed off by Harper Production on/)).toBeVisible()
  await page.goto(`/batches/${batchId}`)
  await expect(page.getByText('status: PENDING QC REVIEW')).toBeVisible()

  // --- QC's first release attempt is blocked by the open deviation
  // (Section 17's new deviation gate) ---
  await logout(page)
  await login(page, 'qc1')
  await page.goto(`/batches/${batchId}/sections/17`)
  await page.getByLabel('Finished Product Specification # / Version').fill('SPEC-BAR-LAV-001')
  await page.getByLabel('In-process test results reviewed').check()
  await page.getByLabel('Decision Basis / Rationale').fill('All checks passed, released per SOP-24.')
  await page.getByLabel('Released').check()
  await submitAndWait(page, 'Save release decision')
  await expect(page.getByText(/open deviations must be resolved first/)).toBeVisible()

  // --- QC resolves the deviation, then release succeeds ---
  await page.goto(`/batches/${batchId}/sections/14`)
  await page.getByPlaceholder('Documented rationale for resolving this deviation…').fill('Confirmed no product impact.')
  await submitAndWait(page, 'Resolve (QC)')
  await expect(page.getByText(/^Resolved by Quinn Quality/)).toBeVisible()

  await page.goto(`/batches/${batchId}/sections/17`)
  await page.getByLabel('Finished Product Specification # / Version').fill('SPEC-BAR-LAV-001')
  await page.getByLabel('In-process test results reviewed').check()
  await page.getByLabel('Decision Basis / Rationale').fill('All checks passed, released per SOP-24.')
  await page.getByLabel('Released').check()
  await submitAndWait(page, 'Save release decision')
  // "Reviewed by" only renders in the post-save summary view, unlike the form
  // itself (whose "Released" radio label would otherwise match a looser check
  // even before the save round-trip completes).
  await expect(page.getByText('Reviewed by')).toBeVisible()

  // --- Final Sign-Off, one signature per role (Section 18) ---
  await page.goto(`/batches/${batchId}/sections/18`)
  await page.getByPlaceholder('Re-enter your password to sign').fill(PASSWORD)
  await submitAndWait(page, 'Sign')
  await expect(page.getByText(/^Signed by Quinn Quality on/)).toBeVisible()

  await logout(page)
  await login(page, 'hop1')
  await page.goto(`/batches/${batchId}/sections/18`)
  await page.getByPlaceholder('Re-enter your password to sign').fill(PASSWORD)
  await submitAndWait(page, 'Sign')
  await expect(page.getByText(/^Signed by Harper Production on/)).toBeVisible()

  await logout(page)
  await login(page, 'operator1')

  // Section 19 — Additional Observations & Notes (available to all 3 roles)
  await page.goto(`/batches/${batchId}/sections/19`)
  await page.locator('#note').fill('E2E test note added before final sign-off.')
  await submitAndWait(page, 'Add note')
  await expect(page.getByText('E2E test note added before final sign-off.')).toBeVisible()

  await page.goto(`/batches/${batchId}/sections/18`)
  await page.getByPlaceholder('Re-enter your password to sign').fill(PASSWORD)
  await submitAndWait(page, 'Sign')
  await expect(page.getByText(/^Signed by Pat Operator on/)).toBeVisible()
  await expect(page.getByText('Batch released.')).toBeVisible()

  // --- Change history (Section 20) reflects the full lifecycle ---
  await logout(page)
  await login(page, 'qc1')
  await page.goto(`/batches/${batchId}/sections/20`)
  await expect(page.getByRole('cell', { name: 'CREATE' }).first()).toBeVisible()
  await expect(page.getByRole('cell', { name: 'RELEASED' }).first()).toBeVisible()
})
