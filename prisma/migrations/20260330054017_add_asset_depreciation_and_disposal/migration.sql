-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "disposalJournalEntryId" TEXT,
ADD COLUMN     "disposalNotes" TEXT,
ADD COLUMN     "disposalProceeds" DECIMAL(12,2),
ADD COLUMN     "disposedAt" TIMESTAMP(3),
ADD COLUMN     "linkedAccountId" TEXT;

-- CreateTable
CREATE TABLE "AssetDepreciationEntry" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "accumulatedTotal" DECIMAL(12,2) NOT NULL,
    "journalEntryId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetDepreciationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssetDepreciationEntry_assetId_idx" ON "AssetDepreciationEntry"("assetId");

-- CreateIndex
CREATE INDEX "AssetDepreciationEntry_tenantId_idx" ON "AssetDepreciationEntry"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDepreciationEntry_assetId_periodId_key" ON "AssetDepreciationEntry"("assetId", "periodId");

-- AddForeignKey
ALTER TABLE "AssetDepreciationEntry" ADD CONSTRAINT "AssetDepreciationEntry_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDepreciationEntry" ADD CONSTRAINT "AssetDepreciationEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccountingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDepreciationEntry" ADD CONSTRAINT "AssetDepreciationEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
