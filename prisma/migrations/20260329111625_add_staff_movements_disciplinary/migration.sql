-- CreateTable
CREATE TABLE "StaffMovement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "oldJobTitle" TEXT,
    "oldDepartment" TEXT,
    "oldUnit" TEXT,
    "oldBasicSalary" DECIMAL(12,2),
    "oldGrade" TEXT,
    "newJobTitle" TEXT,
    "newDepartment" TEXT,
    "newUnit" TEXT,
    "newBasicSalary" DECIMAL(12,2),
    "newGrade" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplinaryRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentDescription" TEXT NOT NULL,
    "actionTaken" TEXT,
    "issuedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "employeeAcknowledgement" BOOLEAN NOT NULL DEFAULT false,
    "appealNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisciplinaryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffMovement_tenantId_employeeId_idx" ON "StaffMovement"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "StaffMovement_tenantId_movementType_idx" ON "StaffMovement"("tenantId", "movementType");

-- CreateIndex
CREATE INDEX "DisciplinaryRecord_tenantId_employeeId_idx" ON "DisciplinaryRecord"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "DisciplinaryRecord_tenantId_actionType_idx" ON "DisciplinaryRecord"("tenantId", "actionType");

-- AddForeignKey
ALTER TABLE "StaffMovement" ADD CONSTRAINT "StaffMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMovement" ADD CONSTRAINT "StaffMovement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaryRecord" ADD CONSTRAINT "DisciplinaryRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaryRecord" ADD CONSTRAINT "DisciplinaryRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
