-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PRODUCTION_OPERATOR', 'HEAD_OF_PRODUCTION', 'QUALITY_UNIT', 'MANAGEMENT_COMPLIANCE', 'SYSTEM_ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'PENDING_HOP_REVIEW', 'PENDING_QC_REVIEW', 'RELEASED', 'REJECTED', 'QUARANTINED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'APPROVED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('BAR_SOAP', 'LIQUID_HAND_SOAP', 'OTHER');

-- CreateEnum
CREATE TYPE "BatchPersonnelRole" AS ENUM ('OPERATOR', 'HEAD_OF_PRODUCTION', 'QC_REVIEWER');

-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('CREATE', 'EDIT', 'CORRECT', 'APPROVE', 'SIGN', 'VIEW', 'EXPORT', 'DELETE', 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT');

-- CreateEnum
CREATE TYPE "ReleaseOutcome" AS ENUM ('RELEASED', 'REJECTED', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "ChecklistItemKey" AS ENUM ('FORMULA_BATCH_SHEET_CURRENT', 'RAW_MATERIALS_DISPENSED_VERIFIED', 'STOREKEEPER_COSIGNATURE_OBTAINED', 'EQUIPMENT_CLEANED_WORKING', 'NO_OUT_OF_SERVICE_OR_CALIBRATION_DUE_TAGS', 'SCALES_CALIBRATION_CURRENT', 'THERMOMETERS_CALIBRATION_CURRENT', 'CROSS_CONTAMINATION_PREVENTION_IN_PLACE', 'PRODUCTION_AREA_CLEARED_PREPARED', 'PERSONAL_HYGIENE_REQUIREMENTS_MET', 'PEST_CONTROL_STATUS_CONFIRMED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "productName" TEXT NOT NULL,
    "productCodeSku" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "finishedProductSpecRef" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formulas" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "formulaNumber" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID NOT NULL,

    CONSTRAINT "formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_records" (
    "id" UUID NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "productId" UUID NOT NULL,
    "formulaId" UUID NOT NULL,
    "formulaVersion" TEXT NOT NULL,
    "batchSizeTarget" DECIMAL(12,3) NOT NULL,
    "batchSizeUnit" TEXT NOT NULL,
    "productionDate" TIMESTAMP(3) NOT NULL,
    "plannedCompletionDate" TIMESTAMP(3),
    "manufacturingSiteRoom" TEXT,
    "complaintRecallRef" TEXT,
    "adverseEventRef" TEXT,
    "retentionDeadline" TIMESTAMP(3) NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_personnel" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleInBatch" "BatchPersonnelRole" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_completion_status" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "sectionNumber" INTEGER NOT NULL,
    "status" "SectionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_completion_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_production_checklist_items" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "itemKey" "ChecklistItemKey" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "operatorInitialsUserId" UUID,
    "verifiedAt" TIMESTAMP(3),
    "hopSignoffUserId" UUID,
    "hopSignoffDate" TIMESTAMP(3),

    CONSTRAINT "pre_production_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_decisions" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "finishedProductSpecRef" TEXT,
    "inProcessResultsReviewed" BOOLEAN,
    "oosResultsPending" BOOLEAN NOT NULL DEFAULT false,
    "decision" "ReleaseOutcome",
    "decisionBasisRationale" TEXT,
    "reviewedById" UUID,
    "reviewDate" TIMESTAMP(3),

    CONSTRAINT "release_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "final_sign_offs" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "userId" UUID NOT NULL,
    "signatureDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "electronicSignatureHash" TEXT NOT NULL,

    CONSTRAINT "final_sign_offs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_trail_entries" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID,
    "userId" UUID,
    "attemptedUsername" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionType" "AuditActionType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "correctionReason" TEXT,
    "ipAddress" TEXT,
    "sessionId" TEXT,

    CONSTRAINT "audit_trail_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "products_productCodeSku_key" ON "products"("productCodeSku");

-- CreateIndex
CREATE UNIQUE INDEX "formulas_productId_formulaNumber_version_key" ON "formulas"("productId", "formulaNumber", "version");

-- CreateIndex
CREATE UNIQUE INDEX "batch_records_batchNumber_key" ON "batch_records"("batchNumber");

-- CreateIndex
CREATE INDEX "batch_records_status_productionDate_idx" ON "batch_records"("status", "productionDate");

-- CreateIndex
CREATE UNIQUE INDEX "batch_personnel_batchRecordId_userId_roleInBatch_key" ON "batch_personnel"("batchRecordId", "userId", "roleInBatch");

-- CreateIndex
CREATE UNIQUE INDEX "section_completion_status_batchRecordId_sectionNumber_key" ON "section_completion_status"("batchRecordId", "sectionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "pre_production_checklist_items_batchRecordId_itemKey_key" ON "pre_production_checklist_items"("batchRecordId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "release_decisions_batchRecordId_key" ON "release_decisions"("batchRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "final_sign_offs_batchRecordId_role_key" ON "final_sign_offs"("batchRecordId", "role");

-- CreateIndex
CREATE INDEX "audit_trail_entries_batchRecordId_idx" ON "audit_trail_entries"("batchRecordId");

-- CreateIndex
CREATE INDEX "audit_trail_entries_entityType_entityId_idx" ON "audit_trail_entries"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_records" ADD CONSTRAINT "batch_records_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_records" ADD CONSTRAINT "batch_records_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_records" ADD CONSTRAINT "batch_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_personnel" ADD CONSTRAINT "batch_personnel_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_personnel" ADD CONSTRAINT "batch_personnel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_completion_status" ADD CONSTRAINT "section_completion_status_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_production_checklist_items" ADD CONSTRAINT "pre_production_checklist_items_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_production_checklist_items" ADD CONSTRAINT "pre_production_checklist_items_operatorInitialsUserId_fkey" FOREIGN KEY ("operatorInitialsUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_production_checklist_items" ADD CONSTRAINT "pre_production_checklist_items_hopSignoffUserId_fkey" FOREIGN KEY ("hopSignoffUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_decisions" ADD CONSTRAINT "release_decisions_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_decisions" ADD CONSTRAINT "release_decisions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_sign_offs" ADD CONSTRAINT "final_sign_offs_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_sign_offs" ADD CONSTRAINT "final_sign_offs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trail_entries" ADD CONSTRAINT "audit_trail_entries_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trail_entries" ADD CONSTRAINT "audit_trail_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
