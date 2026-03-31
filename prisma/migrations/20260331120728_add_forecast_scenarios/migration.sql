-- CreateTable
CREATE TABLE "ForecastScenario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "revenueMultiplier" DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    "expenseMultiplier" DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    "monthlyOverrides" JSONB NOT NULL DEFAULT '[]',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForecastScenario_tenantId_idx" ON "ForecastScenario"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastScenario_tenantId_name_key" ON "ForecastScenario"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "ForecastScenario" ADD CONSTRAINT "ForecastScenario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
