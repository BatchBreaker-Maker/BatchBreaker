-- CreateTable
CREATE TABLE "additional_equipment_entries" (
    "id" UUID NOT NULL,
    "batchRecordId" UUID NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "equipmentNumber" TEXT,
    "cleanedAndVerified" BOOLEAN NOT NULL DEFAULT false,
    "calibrationCurrent" BOOLEAN NOT NULL DEFAULT false,
    "verifiedByUserId" UUID,
    "verifiedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "additional_equipment_entries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "additional_equipment_entries" ADD CONSTRAINT "additional_equipment_entries_batchRecordId_fkey" FOREIGN KEY ("batchRecordId") REFERENCES "batch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_equipment_entries" ADD CONSTRAINT "additional_equipment_entries_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
