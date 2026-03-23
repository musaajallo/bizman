-- CreateTable
CREATE TABLE "Director" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Director',
    "nationality" TEXT,
    "idNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "residentialAddress" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "cessationDate" TIMESTAMP(3),
    "cessationReason" TEXT,
    "shareholding" DECIMAL(5,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Director_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shareholder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'individual',
    "nationality" TEXT,
    "idNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "sharesHeld" INTEGER NOT NULL,
    "shareClass" TEXT NOT NULL DEFAULT 'Ordinary',
    "nominalValue" DECIMAL(12,2),
    "percentageHeld" DECIMAL(5,2) NOT NULL,
    "dateAcquired" TIMESTAMP(3) NOT NULL,
    "dateCeased" TIMESTAMP(3),
    "transferDetails" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shareholder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Director_tenantId_idx" ON "Director"("tenantId");

-- CreateIndex
CREATE INDEX "Director_tenantId_cessationDate_idx" ON "Director"("tenantId", "cessationDate");

-- CreateIndex
CREATE INDEX "Shareholder_tenantId_idx" ON "Shareholder"("tenantId");

-- CreateIndex
CREATE INDEX "Shareholder_tenantId_dateCeased_idx" ON "Shareholder"("tenantId", "dateCeased");

-- AddForeignKey
ALTER TABLE "Director" ADD CONSTRAINT "Director_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shareholder" ADD CONSTRAINT "Shareholder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
