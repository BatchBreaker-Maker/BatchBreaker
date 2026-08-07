/*
  Warnings:

  - You are about to drop the `batch_personnel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "batch_personnel" DROP CONSTRAINT "batch_personnel_batchRecordId_fkey";

-- DropForeignKey
ALTER TABLE "batch_personnel" DROP CONSTRAINT "batch_personnel_userId_fkey";

-- AlterTable
ALTER TABLE "batch_records" ADD COLUMN     "headOfProductionName" TEXT,
ADD COLUMN     "productionOperatorNames" TEXT[],
ADD COLUMN     "qcReviewerName" TEXT;

-- DropTable
DROP TABLE "batch_personnel";

-- DropEnum
DROP TYPE "BatchPersonnelRole";
