-- Section 6.1 (Processing Steps) redesign: fixed rows 1-7, upserted in
-- place (like equipment_verifications), instead of an append-only log with
-- a separate correction trail. Step 8 ("Other") becomes an open-ended list
-- in a new table instead of a fixed row.
--
-- This preserves existing data:
--   - For each (batchRecordId, stepNumber), only the current "tip" row (the
--     one not superseded by any other row's correctsEntryId — i.e. not yet
--     corrected away) is kept; older corrected-away rows are dropped, since
--     the correction-trail UI no longer exists for this section going
--     forward (the underlying audit_trail_entries record of each edit is
--     untouched).
--   - Step 8 tips are moved into the new additional_processing_steps table
--     rather than discarded.

-- 1. New table for the open-ended "Other" steps list.
CREATE TABLE "additional_processing_steps" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "stepDescription" TEXT NOT NULL,
    "timePerformed" TIMESTAMP(3) NOT NULL,
    "performedByUserId" UUID NOT NULL,
    "observationsNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "additional_processing_steps_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "additional_processing_steps" ADD CONSTRAINT "additional_processing_steps_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "additional_processing_steps" ADD CONSTRAINT "additional_processing_steps_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2. Identify the current "tip" of each (batchRecordId, stepNumber) chain —
--    the row nobody else's correctsEntryId points at (not corrected away),
--    most recent by createdAt if more than one such row exists.
--    Move step 8 tips into the new table.
INSERT INTO "additional_processing_steps" ("id", "batchRecordId", "stepDescription", "timePerformed", "performedByUserId", "observationsNotes", "createdAt")
SELECT "id", "batchRecordId", "stepDescription", "timePerformed", "performedByUserId", "observationsNotes", "createdAt"
FROM (
  SELECT DISTINCT ON ("batchRecordId", "stepNumber") *
  FROM "processing_steps"
  WHERE "stepNumber" = 8
    AND "id" NOT IN (
      SELECT "correctsEntryId" FROM "processing_steps" WHERE "correctsEntryId" IS NOT NULL
    )
  ORDER BY "batchRecordId", "stepNumber", "createdAt" DESC
) AS step_eight_tips;

-- 3. Drop all step 8 rows (tips already migrated above; corrected-away
--    history is intentionally not carried forward).
DELETE FROM "processing_steps" WHERE "stepNumber" = 8;

-- 4. Drop corrected-away (non-tip) rows for steps 1-7, leaving at most one
--    row per (batchRecordId, stepNumber).
DELETE FROM "processing_steps"
WHERE "id" IN (
  SELECT "correctsEntryId" FROM "processing_steps" WHERE "correctsEntryId" IS NOT NULL
);

-- 5. If any step somehow still has more than one row (no correction chain
--    linking them — shouldn't normally happen), keep only the most recent.
DELETE FROM "processing_steps"
WHERE "id" NOT IN (
  SELECT DISTINCT ON ("batchRecordId", "stepNumber") "id"
  FROM "processing_steps"
  ORDER BY "batchRecordId", "stepNumber", "createdAt" DESC
);

-- 6. Drop the now-unused correction columns (the FK constraint on
--    correctsEntryId is dropped automatically along with the column).
ALTER TABLE "processing_steps" DROP COLUMN "correctsEntryId";
ALTER TABLE "processing_steps" DROP COLUMN "correctionReason";

-- 7. Enforce one row per (batchRecordId, stepNumber) going forward.
ALTER TABLE "processing_steps" ADD CONSTRAINT "processing_steps_batchRecordId_stepNumber_key" UNIQUE ("batchRecordId", "stepNumber");
