-- CreateTable
CREATE TABLE "SmtpSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "host" TEXT,
    "port" INTEGER NOT NULL DEFAULT 587,
    "username" TEXT,
    "password" TEXT,
    "encryption" TEXT NOT NULL DEFAULT 'tls',
    "fromName" TEXT,
    "fromEmail" TEXT,
    "replyTo" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SmtpSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmtpSettings_tenantId_key" ON "SmtpSettings"("tenantId");

-- AddForeignKey
ALTER TABLE "SmtpSettings" ADD CONSTRAINT "SmtpSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
