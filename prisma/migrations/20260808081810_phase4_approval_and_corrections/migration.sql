-- AlterTable
ALTER TABLE "cutting_observations" ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "correctsEntryId" UUID;

-- AlterTable
ALTER TABLE "press_runs" ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "correctsEntryId" UUID;

-- AlterTable
ALTER TABLE "processing_steps" ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "correctsEntryId" UUID;

-- AlterTable
ALTER TABLE "raw_material_entries" ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "correctsEntryId" UUID;

-- AlterTable
ALTER TABLE "sampling_entries" ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "correctsEntryId" UUID;

-- AlterTable
ALTER TABLE "section_completion_status" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedByUserId" UUID;

-- AlterTable
ALTER TABLE "temperature_entries" ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "correctsEntryId" UUID;

-- AddForeignKey
ALTER TABLE "section_completion_status" ADD CONSTRAINT "section_completion_status_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_entries" ADD CONSTRAINT "raw_material_entries_correctsEntryId_fkey" FOREIGN KEY ("correctsEntryId") REFERENCES "raw_material_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_entries" ADD CONSTRAINT "temperature_entries_correctsEntryId_fkey" FOREIGN KEY ("correctsEntryId") REFERENCES "temperature_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_steps" ADD CONSTRAINT "processing_steps_correctsEntryId_fkey" FOREIGN KEY ("correctsEntryId") REFERENCES "processing_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cutting_observations" ADD CONSTRAINT "cutting_observations_correctsEntryId_fkey" FOREIGN KEY ("correctsEntryId") REFERENCES "cutting_observations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "press_runs" ADD CONSTRAINT "press_runs_correctsEntryId_fkey" FOREIGN KEY ("correctsEntryId") REFERENCES "press_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sampling_entries" ADD CONSTRAINT "sampling_entries_correctsEntryId_fkey" FOREIGN KEY ("correctsEntryId") REFERENCES "sampling_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
