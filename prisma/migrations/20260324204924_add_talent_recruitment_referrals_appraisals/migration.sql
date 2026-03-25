-- CreateTable
CREATE TABLE "TalentPoolEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "linkedInUrl" TEXT,
    "desiredRole" TEXT,
    "department" TEXT,
    "skills" TEXT[],
    "experienceLevel" TEXT,
    "resumeUrl" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "source" TEXT NOT NULL DEFAULT 'self_applied',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentPoolEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "employmentType" TEXT,
    "location" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "salaryMin" DECIMAL(12,2),
    "salaryMax" DECIMAL(12,2),
    "salaryCurrency" TEXT NOT NULL DEFAULT 'GMD',
    "description" TEXT,
    "requirements" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "filledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "talentPoolEntryId" TEXT,
    "candidateName" TEXT NOT NULL,
    "candidateEmail" TEXT,
    "candidatePhone" TEXT,
    "resumeUrl" TEXT,
    "coverLetter" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'applied',
    "rating" INTEGER,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "hiredEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "jobPostingId" TEXT,
    "positionTitle" TEXT NOT NULL,
    "department" TEXT,
    "candidateName" TEXT NOT NULL,
    "candidateEmail" TEXT,
    "candidatePhone" TEXT,
    "candidateLinkedIn" TEXT,
    "resumeUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppraisalCycle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppraisalCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appraisal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "managerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "selfRating" INTEGER,
    "selfComments" TEXT,
    "selfSubmittedAt" TIMESTAMP(3),
    "managerRating" INTEGER,
    "managerComments" TEXT,
    "managerSubmittedAt" TIMESTAMP(3),
    "finalRating" INTEGER,
    "finalComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appraisal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppraisalRating" (
    "id" TEXT NOT NULL,
    "appraisalId" TEXT NOT NULL,
    "criterion" TEXT NOT NULL,
    "selfScore" INTEGER,
    "managerScore" INTEGER,
    "comments" TEXT,

    CONSTRAINT "AppraisalRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppraisalGoal" (
    "id" TEXT NOT NULL,
    "appraisalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppraisalGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TalentPoolEntry_tenantId_status_idx" ON "TalentPoolEntry"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TalentPoolEntry_tenantId_department_idx" ON "TalentPoolEntry"("tenantId", "department");

-- CreateIndex
CREATE UNIQUE INDEX "TalentPoolEntry_tenantId_email_key" ON "TalentPoolEntry"("tenantId", "email");

-- CreateIndex
CREATE INDEX "JobPosting_tenantId_status_idx" ON "JobPosting"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Application_tenantId_stage_idx" ON "Application"("tenantId", "stage");

-- CreateIndex
CREATE INDEX "Application_jobPostingId_stage_idx" ON "Application"("jobPostingId", "stage");

-- CreateIndex
CREATE INDEX "Application_talentPoolEntryId_idx" ON "Application"("talentPoolEntryId");

-- CreateIndex
CREATE INDEX "Referral_tenantId_status_idx" ON "Referral"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_jobPostingId_idx" ON "Referral"("jobPostingId");

-- CreateIndex
CREATE INDEX "AppraisalCycle_tenantId_status_idx" ON "AppraisalCycle"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Appraisal_tenantId_status_idx" ON "Appraisal"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Appraisal_employeeId_idx" ON "Appraisal"("employeeId");

-- CreateIndex
CREATE INDEX "Appraisal_cycleId_status_idx" ON "Appraisal"("cycleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Appraisal_cycleId_employeeId_key" ON "Appraisal"("cycleId", "employeeId");

-- CreateIndex
CREATE INDEX "AppraisalRating_appraisalId_idx" ON "AppraisalRating"("appraisalId");

-- CreateIndex
CREATE INDEX "AppraisalGoal_appraisalId_idx" ON "AppraisalGoal"("appraisalId");

-- AddForeignKey
ALTER TABLE "TalentPoolEntry" ADD CONSTRAINT "TalentPoolEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_talentPoolEntryId_fkey" FOREIGN KEY ("talentPoolEntryId") REFERENCES "TalentPoolEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppraisalCycle" ADD CONSTRAINT "AppraisalCycle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appraisal" ADD CONSTRAINT "Appraisal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appraisal" ADD CONSTRAINT "Appraisal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AppraisalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appraisal" ADD CONSTRAINT "Appraisal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppraisalRating" ADD CONSTRAINT "AppraisalRating_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppraisalGoal" ADD CONSTRAINT "AppraisalGoal_appraisalId_fkey" FOREIGN KEY ("appraisalId") REFERENCES "Appraisal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
