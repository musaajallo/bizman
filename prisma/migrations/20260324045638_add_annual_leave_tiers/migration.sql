-- AlterTable
ALTER TABLE "LeaveSettings" ADD COLUMN     "annualLeaveTiers" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "LeaveSettingsLog" ADD COLUMN     "annualLeaveTiers" JSONB NOT NULL DEFAULT '[]';
