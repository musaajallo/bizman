-- AlterTable
ALTER TABLE "OvertimeRequest" ADD COLUMN     "appliedRateMultiplier" DECIMAL(5,2),
ADD COLUMN     "calculatedPay" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "OvertimeSettingsLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "standardRateMultiplier" DECIMAL(5,2) NOT NULL,
    "weekendRateMultiplier" DECIMAL(5,2) NOT NULL,
    "holidayRateMultiplier" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OvertimeSettingsLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OvertimeSettingsLog_tenantId_createdAt_idx" ON "OvertimeSettingsLog"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "OvertimeSettingsLog" ADD CONSTRAINT "OvertimeSettingsLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeSettingsLog" ADD CONSTRAINT "OvertimeSettingsLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
