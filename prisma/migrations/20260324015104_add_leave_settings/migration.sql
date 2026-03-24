-- CreateTable
CREATE TABLE "LeaveSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "maternityLeaveDays" INTEGER NOT NULL DEFAULT 180,
    "maternityCanCombineWithAnnual" BOOLEAN NOT NULL DEFAULT true,
    "paternityLeaveDays" INTEGER NOT NULL DEFAULT 10,
    "paternityCanCombineWithAnnual" BOOLEAN NOT NULL DEFAULT true,
    "sickLeaveAccrualPerMonth" DECIMAL(4,2) NOT NULL DEFAULT 1.5,
    "annualLeaveDefaultDays" INTEGER NOT NULL DEFAULT 21,

    CONSTRAINT "LeaveSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveSettingsLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "maternityLeaveDays" INTEGER NOT NULL,
    "maternityCanCombineWithAnnual" BOOLEAN NOT NULL,
    "paternityLeaveDays" INTEGER NOT NULL,
    "paternityCanCombineWithAnnual" BOOLEAN NOT NULL,
    "sickLeaveAccrualPerMonth" DECIMAL(4,2) NOT NULL,
    "annualLeaveDefaultDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveSettingsLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaveSettings_tenantId_key" ON "LeaveSettings"("tenantId");

-- CreateIndex
CREATE INDEX "LeaveSettingsLog_tenantId_createdAt_idx" ON "LeaveSettingsLog"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "LeaveSettings" ADD CONSTRAINT "LeaveSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveSettingsLog" ADD CONSTRAINT "LeaveSettingsLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveSettingsLog" ADD CONSTRAINT "LeaveSettingsLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
