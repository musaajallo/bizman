-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "discountCaptured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "discountDays" INTEGER,
ADD COLUMN     "discountPercent" DECIMAL(5,2),
ADD COLUMN     "paymentTermsDays" INTEGER;
