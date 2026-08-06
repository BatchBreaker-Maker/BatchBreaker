import { test, expect, type Page } from '@playwright/test'

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

test('Phase 1 happy path: create batch through release, plus role-denial checks', async ({ page }) => {
  // --- HoP creates the batch (Section 1) ---
  await login(page, 'hop1')
  await page.getByRole('link', { name: '+ New batch record' }).click()
  await page.getByLabel('Batch Size (target)').fill('50')
  await page.getByLabel('Unit').fill('lb')
  await page.getByLabel('Production Date').fill('2026-08-06')
  await page.getByLabel('Manufacturing Site / Room').fill('Production Room A')
  await page.getByRole('button', { name: 'Create batch record' }).click()
  await page.waitForURL(/\/batches\/[0-9a-f-]+$/)

  const batchUrl = page.url()
  const batchId = batchUrl.split('/batches/')[1]
  await expect(page.getByRole('heading', { name: /^GCM-\d{8}-\d{3}$/ })).toBeVisible()

  // --- Negative check: Production Operator cannot see Sections 17/20.
  // (Section 18 is a legitimate three-way sign-off that includes the
  // operator, per spec section 2.2 row 18 — not part of this check.)
  await logout(page)
  await login(page, 'operator1')
  for (const section of [17, 20]) {
    await page.goto(`/batches/${batchId}/sections/${section}`)
    await expect(page.getByText('You do not have permission to view this section.')).toBeVisible()
  }

  // --- HoP assigns personnel (Section 2) ---
  await logout(page)
  await login(page, 'hop1')
  await page.goto(`/batches/${batchId}/sections/2`)
  await page.getByRole('button', { name: 'Save personnel' }).click()
  await expect(page.getByText('COMPLETE').first()).toBeVisible()

  // --- Complete and sign off the Pre-Production Checklist (Section 3) ---
  await page.goto(`/batches/${batchId}/sections/3`)
  const checkboxes = page.locator('form input[type=checkbox]')
  const count = await checkboxes.count()
  expect(count).toBe(11)
  for (let i = 0; i < count; i++) {
    await checkboxes.nth(i).check()
  }
  await page.getByRole('button', { name: 'Save checklist' }).click()
  await page.getByRole('button', { name: 'Sign off Section 3 as Head of Production' }).click()
  await expect(page.getByText(/^Signed off by Harper Production on/)).toBeVisible()

  // --- HoP submits for QC review ---
  await page.goto(`/batches/${batchId}`)
  await page.getByRole('button', { name: 'Submit for QC review' }).click()
  await expect(page.getByText('status: PENDING QC REVIEW')).toBeVisible()

  // --- QC records the release decision (Section 17) ---
  await logout(page)
  await login(page, 'qc1')
  await page.goto(`/batches/${batchId}/sections/17`)
  await page.getByLabel('Finished Product Specification # / Version').fill('SPEC-BAR-LAV-001')
  await page.getByLabel('In-process test results reviewed').check()
  await page.getByLabel('Decision Basis / Rationale').fill('All checks passed, released per SOP-24.')
  await page.getByLabel('Released').check()
  await page.getByRole('button', { name: 'Save release decision' }).click()
  // "Reviewed by" only renders in the post-save summary view, unlike the form
  // itself (whose "Released" radio label would otherwise match a looser check
  // even before the save round-trip completes).
  await expect(page.getByText('Reviewed by')).toBeVisible()

  // --- Final Sign-Off, one signature per role (Section 18) ---
  await page.goto(`/batches/${batchId}/sections/18`)
  await page.getByPlaceholder('Re-enter your password to sign').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign' }).click()
  await expect(page.getByText(/^Signed by Quinn Quality on/)).toBeVisible()

  await logout(page)
  await login(page, 'hop1')
  await page.goto(`/batches/${batchId}/sections/18`)
  await page.getByPlaceholder('Re-enter your password to sign').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign' }).click()
  await expect(page.getByText(/^Signed by Harper Production on/)).toBeVisible()

  await logout(page)
  await login(page, 'operator1')
  await page.goto(`/batches/${batchId}/sections/18`)
  await page.getByPlaceholder('Re-enter your password to sign').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign' }).click()
  await expect(page.getByText(/^Signed by Pat Operator on/)).toBeVisible()
  await expect(page.getByText('Batch released.')).toBeVisible()

  // --- Change history (Section 20) reflects the full lifecycle ---
  await logout(page)
  await login(page, 'qc1')
  await page.goto(`/batches/${batchId}/sections/20`)
  await expect(page.getByText('CREATE')).toBeVisible()
  await expect(page.getByRole('cell', { name: 'RELEASED' }).first()).toBeVisible()
})
