/*
  Warnings:

  - A unique constraint covering the columns `[convertedFromId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Invoice_tenantId_status_idx";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "convertedFromId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'standard';

-- AlterTable
ALTER TABLE "InvoiceSettings" ADD COLUMN     "proformaNextNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "proformaPrefix" TEXT NOT NULL DEFAULT 'PRO';

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_convertedFromId_key" ON "Invoice"("convertedFromId");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_type_status_idx" ON "Invoice"("tenantId", "type", "status");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_convertedFromId_fkey" FOREIGN KEY ("convertedFromId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
