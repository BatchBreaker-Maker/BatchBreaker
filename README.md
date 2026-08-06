# BatchBreaker

Batch Record Management System (BRMS) for GCFI Soap Manufacturing — a web app that digitizes the 11-page paper GMP batch production record (GCFI-REC-___) into a compliant, auditable, role-gated workflow system. Not an ERP: scoped to batch-record lifecycle only (create → complete by role → review → QC release → retain 6 years → retrieve for audit).

Full specification: `Project Specs and Master Batch Record Template/Batch Breaker - Batch Record System Specs.md` (in the parent project folder).

## Status

**Phase 1 of 5** — thin slice proven end-to-end: Sections 1, 2, 3, 17, 18, and 20 are built and working, taking one batch record all the way from creation through a three-signature electronic release. Sections 4–16 and 19 (the bulk of in-process production data entry) ship in later phases.

## Stack

Next.js 16 (App Router) · TypeScript · Prisma 7 (driver adapters, `@prisma/adapter-neon`) · PostgreSQL (Neon) · Tailwind CSS · Playwright

## Getting started

```bash
npm install
npx prisma generate
npm run dev
```

Requires a `.env` with `DATABASE_URL`, `APP_DATABASE_URL`, `SESSION_SECRET`, and `E_SIGNATURE_SECRET` — see a project maintainer for local dev values (not committed, by design).

`DATABASE_URL` is the schema-owner credential used only by the Prisma CLI (migrate/generate/seed). `APP_DATABASE_URL` is a separate, restricted database role the running app actually connects as — it cannot `UPDATE` or `DELETE` `audit_trail_entries`, enforced at the database level so the audit trail stays immutable even against an application bug.

## Testing

```bash
npx tsc --noEmit      # type check
npx eslint .           # lint
npx playwright test    # end-to-end (spins up the dev server automatically)
```

## Architecture notes

- **Auth is hand-rolled, not Auth.js** — the app needs database-backed sessions so deactivating a user revokes access immediately, and Auth.js's Credentials provider only supports JWT sessions. See `src/lib/auth/session.ts`.
- **Every section's access level comes from one matrix** (`src/lib/auth/permissionMatrix.ts`), matching spec §2.2, checked server-side in every Server Action — not just used to hide UI.
- **Every mutation goes through one audit writer** (`src/lib/audit/recordAuditEntry.ts`) so `audit_trail_entries` can't drift from what actually happened.
- Section 18's e-signature is password re-authentication plus an audit-grade hash (`src/lib/auth/signature.ts`), not a third-party e-sign product.

## Deployment

Designed to be portable — no cloud-proprietary services baked into the app itself. Currently deploying to Vercel via this GitHub repository.
