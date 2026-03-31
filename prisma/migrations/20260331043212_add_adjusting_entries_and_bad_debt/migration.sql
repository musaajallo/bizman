-- CreateTable
CREATE TABLE "AdjustingEntryTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "debitAccountId" TEXT NOT NULL,
    "creditAccountId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "isReversing" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdjustingEntryTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadDebtConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agingBuckets" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadDebtConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdjustingEntryTemplate_tenantId_idx" ON "AdjustingEntryTemplate"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BadDebtConfig_tenantId_key" ON "BadDebtConfig"("tenantId");

-- AddForeignKey
ALTER TABLE "AdjustingEntryTemplate" ADD CONSTRAINT "AdjustingEntryTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjustingEntryTemplate" ADD CONSTRAINT "AdjustingEntryTemplate_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjustingEntryTemplate" ADD CONSTRAINT "AdjustingEntryTemplate_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadDebtConfig" ADD CONSTRAINT "BadDebtConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
