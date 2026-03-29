-- CreateTable
CREATE TABLE "BenefitType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "valueType" TEXT NOT NULL DEFAULT 'fixed',
    "defaultValue" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BenefitType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeBenefit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "benefitTypeId" TEXT NOT NULL,
    "overrideValue" DECIMAL(12,2),
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BenefitType_tenantId_idx" ON "BenefitType"("tenantId");

-- CreateIndex
CREATE INDEX "EmployeeBenefit_tenantId_employeeId_idx" ON "EmployeeBenefit"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "EmployeeBenefit_benefitTypeId_idx" ON "EmployeeBenefit"("benefitTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeBenefit_employeeId_benefitTypeId_key" ON "EmployeeBenefit"("employeeId", "benefitTypeId");

-- CreateIndex
CREATE INDEX "Application_hiredEmployeeId_idx" ON "Application"("hiredEmployeeId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_hiredEmployeeId_fkey" FOREIGN KEY ("hiredEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitType" ADD CONSTRAINT "BenefitType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeBenefit" ADD CONSTRAINT "EmployeeBenefit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeBenefit" ADD CONSTRAINT "EmployeeBenefit_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeBenefit" ADD CONSTRAINT "EmployeeBenefit_benefitTypeId_fkey" FOREIGN KEY ("benefitTypeId") REFERENCES "BenefitType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
