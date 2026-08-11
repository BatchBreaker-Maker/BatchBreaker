-- Add correction support to additional_processing_steps, mirroring
-- temperature_entries' correction columns. Purely additive — both new
-- columns are nullable, so existing rows are unaffected.

ALTER TABLE "additional_processing_steps" ADD COLUMN "correctsEntryId" UUID;
ALTER TABLE "additional_processing_steps" ADD COLUMN "correctionReason" TEXT;

ALTER TABLE "additional_processing_steps" ADD CONSTRAINT "additional_processing_steps_correctsEntryId_fkey" FOREIGN KEY ("correctsEntryId") REFERENCES "additional_processing_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
