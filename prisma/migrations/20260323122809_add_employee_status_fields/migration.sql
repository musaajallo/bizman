-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "leaveEndDate" TIMESTAMP(3),
ADD COLUMN     "leaveType" TEXT,
ADD COLUMN     "terminationReason" TEXT;
