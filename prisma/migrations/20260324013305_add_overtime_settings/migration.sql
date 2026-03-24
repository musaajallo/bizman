-- CreateTable
CREATE TABLE "OvertimeSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "standardRateMultiplier" DECIMAL(5,2) NOT NULL DEFAULT 1.5,
    "weekendRateMultiplier" DECIMAL(5,2) NOT NULL DEFAULT 2.0,
    "holidayRateMultiplier" DECIMAL(5,2) NOT NULL DEFAULT 2.5,

    CONSTRAINT "OvertimeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OvertimeSettings_tenantId_key" ON "OvertimeSettings"("tenantId");

-- AddForeignKey
ALTER TABLE "OvertimeSettings" ADD CONSTRAINT "OvertimeSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
