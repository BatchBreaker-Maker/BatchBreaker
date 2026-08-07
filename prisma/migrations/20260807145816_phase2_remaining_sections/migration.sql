/*
  Warnings:

  - You are about to drop the column `formulaId` on the `batch_records` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `batch_records` table. All the data in the column will be lost.
  - You are about to drop the `formulas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `formulaNumber` to the `batch_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productName` to the `batch_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productType` to the `batch_records` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SupplierQualStatus" AS ENUM ('APPROVED', 'CONDITIONAL', 'BLOCKED');

-- CreateEnum
CREATE TYPE "HomogeneityCheckItem" AS ENUM ('HOMOGENEITY', 'ABSENCE_OF_FOREIGN_MATTER', 'FRAGRANCE_INCORPORATION', 'COLORANT_INCORPORATION', 'NO_SEPARATION_OR_RICING');

-- CreateEnum
CREATE TYPE "PassFail" AS ENUM ('PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "CurePhase" AS ENUM ('PRE_CUT', 'POST_CUT');

-- CreateEnum
CREATE TYPE "DispositionType" AS ENUM ('TESTED_RELEASED', 'RETAINED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "PrePackagingChecklistItemKey" AS ENUM ('AREA_CLEARED', 'EQUIPMENT_CLEANED_HOP_VERIFIED', 'COMPONENTS_FIFO_STORE_LOG', 'COA_INSPECTION_REVIEWED', 'LABEL_VERSION_CONFIRMED', 'WIP_MARKED_PRODUCT_BATCH');

-- CreateEnum
CREATE TYPE "EquipmentRowKey" AS ENUM ('MIXING_VESSEL_POT', 'STICK_BLENDER', 'SCALES', 'INFRARED_THERMOMETER', 'MOLDS', 'CUTTING_MACHINES', 'PACKAGING_EQUIPMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DeviationType" AS ENUM ('INCIDENT', 'DEVIATION', 'CRITICAL_DEVIATION');

-- CreateEnum
CREATE TYPE "DeviationStatus" AS ENUM ('OPEN', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "YesNoNA" AS ENUM ('YES', 'NO', 'NA');

-- CreateEnum
CREATE TYPE "CompletenessReviewItemKey" AS ENUM ('FORMULA_VERSION_DOCUMENTED', 'RAW_MATERIALS_RECORDED_WITH_COA_AND_QUALIFICATION', 'PRODUCTION_STEPS_COMPLETED_INITIALED', 'TEMPERATURES_RECORDED', 'SAMPLING_LOG_COMPLETE_WITH_DISPOSITION', 'PH_AND_FREE_CAUSTIC_RECORDED', 'YIELD_RECONCILIATION_COMPLETED', 'CURE_HOLD_RECORD_COMPLETED', 'CUTTING_OBSERVATIONS_RECORDED', 'COMPLAINT_RECALL_AE_FIELDS_COMPLETED_OR_NA', 'DEVIATION_SECTION_COMPLETED', 'RETAINED_SAMPLES_DOCUMENTED', 'EQUIPMENT_CLEANING_VERIFICATION_COMPLETE', 'PACKAGING_OPERATIONS_COMPLETE', 'SUBCONTRACTING_FIELD_COMPLETED_OR_NA', 'POST_PRODUCTION_CLOSEOUT_ENTRIES_MADE', 'RETENTION_DEADLINE_ENTERED', 'NO_BLANK_FIELDS', 'CORRECTIONS_PROPERLY_MADE', 'FINISHED_PRODUCT_SPEC_REFERENCED', 'BATCH_STATUS_DECISION_COMPLETED');

-- DropForeignKey
ALTER TABLE "batch_records" DROP CONSTRAINT "batch_records_formulaId_fkey";

-- DropForeignKey
ALTER TABLE "batch_records" DROP CONSTRAINT "batch_records_productId_fkey";

-- DropForeignKey
ALTER TABLE "formulas" DROP CONSTRAINT "formulas_createdById_fkey";

-- DropForeignKey
ALTER TABLE "formulas" DROP CONSTRAINT "formulas_productId_fkey";

-- AlterTable
ALTER TABLE "batch_records" DROP COLUMN "formulaId",
DROP COLUMN "productId",
ADD COLUMN     "cuttingOverallComments" TEXT,
ADD COLUMN     "finishedProductSpecRef" TEXT,
ADD COLUMN     "formulaNumber" TEXT NOT NULL,
ADD COLUMN     "noDeviationsConfirmedByUserId" UUID,
ADD COLUMN     "noDeviationsConfirmedDate" TIMESTAMP(3),
ADD COLUMN     "productCodeSku" TEXT,
ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "productType" "ProductType" NOT NULL;

-- DropTable
DROP TABLE "formulas";

-- DropTable
DROP TABLE "products";

-- CreateTable
CREATE TABLE "raw_material_entries" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "tradeNameDescription" TEXT NOT NULL,
    "internalPartCode" TEXT,
    "supplierName" TEXT NOT NULL,
    "supplierLotBatchNumber" TEXT NOT NULL,
    "qtyDispensed" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "coaReceived" BOOLEAN NOT NULL DEFAULT false,
    "supplierQualStatus" "SupplierQualStatus" NOT NULL,
    "notes" TEXT,
    "verifiedByStorekeeperId" UUID,
    "storekeeperInitials" TEXT,
    "storekeeperVerifiedDate" TIMESTAMP(3),
    "verifiedByHopId" UUID,
    "hopVerifiedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_material_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temperature_entries" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "materialIngredient" TEXT NOT NULL,
    "acceptableTempMinF" DECIMAL(6,2) NOT NULL,
    "acceptableTempMaxF" DECIMAL(6,2) NOT NULL,
    "actualTempF" DECIMAL(6,2) NOT NULL,
    "withinRange" BOOLEAN NOT NULL,
    "timeOfAddition" TIMESTAMP(3) NOT NULL,
    "operatorUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temperature_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processing_steps" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "stepDescription" TEXT NOT NULL,
    "timePerformed" TIMESTAMP(3) NOT NULL,
    "performedByUserId" UUID NOT NULL,
    "observationsNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processing_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homogeneity_checks" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "checkItem" "HomogeneityCheckItem" NOT NULL,
    "timeObserved" TIMESTAMP(3),
    "result" "PassFail",
    "comments" TEXT,

    CONSTRAINT "homogeneity_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cure_records" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "phase" "CurePhase" NOT NULL,
    "dateTimeStart" TIMESTAMP(3),
    "targetCureDuration" TEXT,
    "dateTimeRemoved" TIMESTAMP(3),
    "curingLocationConditions" TEXT,
    "curePeriodAcceptable" BOOLEAN,
    "phMeasurementDateTime" TIMESTAMP(3),
    "phResult" DECIMAL(5,2),
    "freeCausticCheckMethod" TEXT,
    "freeCausticCheckResult" TEXT,

    CONSTRAINT "cure_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cutting_observations" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "pourNumber" INTEGER NOT NULL,
    "tempTopF" DECIMAL(6,2),
    "tempSideF" DECIMAL(6,2),
    "tempMiddleF" DECIMAL(6,2),
    "colorUniformity" TEXT,
    "visibleSeparation" BOOLEAN NOT NULL DEFAULT false,
    "foreignMatter" BOOLEAN NOT NULL DEFAULT false,
    "fragranceAdditionalComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cutting_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stamping_setups" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "dieStampId" TEXT NOT NULL,
    "dieConditionInspected" BOOLEAN NOT NULL DEFAULT false,
    "setupVerifiedByUserId" UUID,
    "setupDate" TIMESTAMP(3),
    "totalBarsStamped" INTEGER,
    "totalBarsRejected" INTEGER,

    CONSTRAINT "stamping_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "press_runs" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "dieStampId" TEXT NOT NULL,
    "impressionQuality" TEXT,
    "barSurfaceCondition" TEXT,
    "appearanceOk" BOOLEAN NOT NULL DEFAULT true,
    "operatorUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "press_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sampling_entries" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "samplingStage" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "resultObservation" TEXT,
    "actionTaken" TEXT,
    "disposition" "DispositionType" NOT NULL,
    "dispositionReason" TEXT,
    "samplerUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sampling_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yield_reconciliations" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "expectedYield" DECIMAL(12,3) NOT NULL,
    "expectedYieldUnit" TEXT NOT NULL,
    "actualYield" DECIMAL(12,3) NOT NULL,
    "actualYieldUnit" TEXT NOT NULL,
    "varianceAcceptable" BOOLEAN NOT NULL,
    "investigationInitiated" BOOLEAN,
    "notesDisposition" TEXT,

    CONSTRAINT "yield_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_packaging_checklist_items" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "itemKey" "PrePackagingChecklistItemKey" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "pre_packaging_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packaging_checks" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "checkNumber" INTEGER NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "componentCorrect" BOOLEAN NOT NULL DEFAULT true,
    "labelCorrect" BOOLEAN NOT NULL DEFAULT true,
    "appearanceOk" BOOLEAN NOT NULL DEFAULT true,
    "fillWeightOk" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "packaging_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packaging_returns" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "returned" "YesNoNA" NOT NULL,
    "quantitiesReturned" TEXT,
    "returnedByUserId" UUID,
    "returnedDate" TIMESTAMP(3),

    CONSTRAINT "packaging_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retained_sample_records" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "unitsCollected" INTEGER NOT NULL,
    "sampleLabelApplied" BOOLEAN NOT NULL DEFAULT false,
    "storageLocation" TEXT NOT NULL,
    "dateCollected" TIMESTAMP(3) NOT NULL,
    "collectedByUserId" UUID NOT NULL,
    "notes" TEXT,
    "minimumRetentionPeriod" TEXT,
    "scheduledDestructionReviewDate" TIMESTAMP(3) NOT NULL,
    "destructionAuthorizedByUserId" UUID,
    "destructionDate" TIMESTAMP(3),

    CONSTRAINT "retained_sample_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_verifications" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "rowKey" "EquipmentRowKey" NOT NULL,
    "equipmentId" TEXT,
    "cleanedAndVerified" BOOLEAN NOT NULL DEFAULT false,
    "calibrationCurrent" BOOLEAN NOT NULL DEFAULT false,
    "verifiedByUserId" UUID,
    "verifiedDate" TIMESTAMP(3),

    CONSTRAINT "equipment_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deviation_entries" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "type" "DeviationType" NOT NULL,
    "description" TEXT NOT NULL,
    "correctiveActionTaken" TEXT,
    "reportedToUserId" UUID,
    "status" "DeviationStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedByUserId" UUID,
    "resolutionRationale" TEXT,
    "resolvedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deviation_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_production_closeouts" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "bulkStorageLocation" TEXT NOT NULL,
    "enteredInStoreLog" BOOLEAN NOT NULL DEFAULT false,
    "enteredInErp" "YesNoNA" NOT NULL,
    "unusedRmReturned" "YesNoNA" NOT NULL,
    "quantitiesRmReturned" TEXT,
    "stepsSubcontracted" BOOLEAN NOT NULL DEFAULT false,
    "subcontractorNameStep" TEXT,
    "subcontractorRecordAttached" BOOLEAN,
    "batchCloseoutDate" TIMESTAMP(3) NOT NULL,
    "closeoutByUserId" UUID NOT NULL,

    CONSTRAINT "post_production_closeouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completeness_review_items" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "itemKey" "CompletenessReviewItemKey" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "notApplicable" BOOLEAN NOT NULL DEFAULT false,
    "hopInitialsUserId" UUID,
    "hopSignatureUserId" UUID,
    "hopSignatureDate" TIMESTAMP(3),

    CONSTRAINT "completeness_review_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_notes" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raw_material_entries_supplierLotBatchNumber_idx" ON "raw_material_entries"("supplierLotBatchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "homogeneity_checks_batchRecordId_checkItem_key" ON "homogeneity_checks"("batchRecordId", "checkItem");

-- CreateIndex
CREATE UNIQUE INDEX "cure_records_batchRecordId_phase_key" ON "cure_records"("batchRecordId", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "stamping_setups_batchRecordId_key" ON "stamping_setups"("batchRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "yield_reconciliations_batchRecordId_key" ON "yield_reconciliations"("batchRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "pre_packaging_checklist_items_batchRecordId_itemKey_key" ON "pre_packaging_checklist_items"("batchRecordId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "packaging_returns_batchRecordId_key" ON "packaging_returns"("batchRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "retained_sample_records_batchRecordId_key" ON "retained_sample_records"("batchRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_verifications_batchRecordId_rowKey_key" ON "equipment_verifications"("batchRecordId", "rowKey");

-- CreateIndex
CREATE UNIQUE INDEX "post_production_closeouts_batchRecordId_key" ON "post_production_closeouts"("batchRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "completeness_review_items_batchRecordId_itemKey_key" ON "completeness_review_items"("batchRecordId", "itemKey");

-- AddForeignKey
ALTER TABLE "batch_records" ADD CONSTRAINT "batch_records_noDeviationsConfirmedByUserId_fkey" FOREIGN KEY ("noDeviationsConfirmedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_entries" ADD CONSTRAINT "raw_material_entries_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_entries" ADD CONSTRAINT "raw_material_entries_verifiedByStorekeeperId_fkey" FOREIGN KEY ("verifiedByStorekeeperId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_entries" ADD CONSTRAINT "raw_material_entries_verifiedByHopId_fkey" FOREIGN KEY ("verifiedByHopId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_entries" ADD CONSTRAINT "temperature_entries_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_entries" ADD CONSTRAINT "temperature_entries_operatorUserId_fkey" FOREIGN KEY ("operatorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_steps" ADD CONSTRAINT "processing_steps_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_steps" ADD CONSTRAINT "processing_steps_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homogeneity_checks" ADD CONSTRAINT "homogeneity_checks_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cure_records" ADD CONSTRAINT "cure_records_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cutting_observations" ADD CONSTRAINT "cutting_observations_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stamping_setups" ADD CONSTRAINT "stamping_setups_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stamping_setups" ADD CONSTRAINT "stamping_setups_setupVerifiedByUserId_fkey" FOREIGN KEY ("setupVerifiedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "press_runs" ADD CONSTRAINT "press_runs_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "press_runs" ADD CONSTRAINT "press_runs_operatorUserId_fkey" FOREIGN KEY ("operatorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sampling_entries" ADD CONSTRAINT "sampling_entries_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sampling_entries" ADD CONSTRAINT "sampling_entries_samplerUserId_fkey" FOREIGN KEY ("samplerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yield_reconciliations" ADD CONSTRAINT "yield_reconciliations_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_packaging_checklist_items" ADD CONSTRAINT "pre_packaging_checklist_items_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_packaging_checklist_items" ADD CONSTRAINT "pre_packaging_checklist_items_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packaging_checks" ADD CONSTRAINT "packaging_checks_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packaging_returns" ADD CONSTRAINT "packaging_returns_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packaging_returns" ADD CONSTRAINT "packaging_returns_returnedByUserId_fkey" FOREIGN KEY ("returnedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retained_sample_records" ADD CONSTRAINT "retained_sample_records_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retained_sample_records" ADD CONSTRAINT "retained_sample_records_collectedByUserId_fkey" FOREIGN KEY ("collectedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retained_sample_records" ADD CONSTRAINT "retained_sample_records_destructionAuthorizedByUserId_fkey" FOREIGN KEY ("destructionAuthorizedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_verifications" ADD CONSTRAINT "equipment_verifications_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_verifications" ADD CONSTRAINT "equipment_verifications_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deviation_entries" ADD CONSTRAINT "deviation_entries_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deviation_entries" ADD CONSTRAINT "deviation_entries_reportedToUserId_fkey" FOREIGN KEY ("reportedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deviation_entries" ADD CONSTRAINT "deviation_entries_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_production_closeouts" ADD CONSTRAINT "post_production_closeouts_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_production_closeouts" ADD CONSTRAINT "post_production_closeouts_closeoutByUserId_fkey" FOREIGN KEY ("closeoutByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completeness_review_items" ADD CONSTRAINT "completeness_review_items_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completeness_review_items" ADD CONSTRAINT "completeness_review_items_hopInitialsUserId_fkey" FOREIGN KEY ("hopInitialsUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completeness_review_items" ADD CONSTRAINT "completeness_review_items_hopSignatureUserId_fkey" FOREIGN KEY ("hopSignatureUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_notes" ADD CONSTRAINT "batch_notes_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_notes" ADD CONSTRAINT "batch_notes_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
